import { saveAs } from 'file-saver'

const API_URL = process.env.API_URL

$('#mainTab a').on('click', function(e) {
  e.preventDefault()
  $(this).tab('show')
})

$('[data-toggle="tooltip"]').tooltip()

const resultLink = document.getElementById('link-results')

const submitButton = document.getElementById('btn-submit')
submitButton.addEventListener('click', function() {
  resultLink.click()
  run()
})

const exampleButton = document.getElementById('btn-example')
exampleButton.addEventListener('click', showExample)

const inputFile = document.getElementById('inputFile')
const leftTrim = document.querySelector('#leftTrim')
const rightTrim = document.querySelector('#rightTrim')
const peakRatio = document.querySelector('#peakRatio')
const targetFastaFile = document.getElementById('targetFileFasta')
const targetChromatogramFile = document.getElementById('targetFileChromatogram')
const targetGenomes = document.getElementById('target-genome')
const targetTabs = document.getElementById('target-tabs')
const linkPdf = document.getElementById('link-pdf')
const decompositionChart = document.getElementById('decomposition-chart')
const alignmentChart1 = document.getElementById('alignment-chart-1')
const alignmentChart2 = document.getElementById('alignment-chart-2')
const alignmentChart3 = document.getElementById('alignment-chart-3')
const traceChart = document.getElementById('trace-chart')
const variantsTable = document.getElementById('variants-table')
const resultContainer = document.getElementById('result-container')
const resultInfo = document.getElementById('result-info')
const resultError = document.getElementById('result-error')
let downloadUrl

function updatePeakRatioValue() {
  document.getElementById('peakRatioValue').innerText = peakRatio.value
}

updatePeakRatioValue()
window.updatePeakRatioValue = updatePeakRatioValue

// TODO client-side validation
function run() {
  const lTrim = Number.parseInt(leftTrim.value, 10)
  const rTrim = Number.parseInt(rightTrim.value, 10)
  const pRatio = Number.parseInt(peakRatio.value, 10)

  const formData = new FormData()
  formData.append('queryFile', inputFile.files[0])
  formData.append('leftTrim', lTrim)
  formData.append('rightTrim', rTrim)
  formData.append('peakRatio', pRatio)
  const target = targetTabs.querySelector('a.active').id

  if (target.startsWith('target-genome')) {
    const genome = targetGenomes.querySelector('option:checked').value
    formData.append('genome', genome)
  } else if (target.startsWith('target-fasta')) {
    formData.append('fastaFile', targetFastaFile.files[0])
  } else if (target.startsWith('target-chromatogram')) {
    formData.append('chromatogramFile', targetChromatogramFile.files[0])
  }

  hideElement(resultContainer)
  hideElement(resultError)
  showElement(resultInfo)

  axios
    .post(`${API_URL}/upload`, formData)
    .then(res => {
      if (res.status === 200) {
        handleSuccess(res.data.data)
      }
    })
    .catch(err => {
      let errorMessage = err
      if (err.response) {
        errorMessage = err.response.data.errors
          .map(error => error.title)
          .join('; ')
      }
      hideElement(resultInfo)
      showElement(resultError)
      resultError.querySelector('#error-message').textContent = errorMessage
    })
}

function handleSuccess(data) {
  hideElement(resultInfo)
  hideElement(resultError)
  showElement(resultContainer)

  // needed in downloadBcf() as well
  downloadUrl = data.url
  linkPdf.href = `${API_URL}/${downloadUrl}/pdf`

  const traceData = convertTraceData(data)
  renderTraceChart(traceChart, traceData, data.chartConfig)

  renderDecompositionChart(decompositionChart, {
    x: data.decomposition.x,
    y: data.decomposition.y
  })

  const alignmentCharactersPerLine = 80

  const alt1 = {
    sequence: ungapped(data.alt1align),
    alignmentString: data.alt1align,
    isReverseComplement: false,
    chromosome: 'Alt1',
    startPosition: 1,
    label: 'Alt1',
    alleleFraction: data.allele1fraction
  }

  const ref1 = {
    sequence: ungapped(data.ref1align),
    alignmentString: data.ref1align,
    isReverseComplement: data.ref1forward === 0,
    chromosome: data.ref1chr,
    startPosition: data.ref1pos,
    label: 'Ref'
  }

  renderAlignmentChart(alignmentChart1, {
    alt: alt1,
    ref: ref1,
    charactersPerLine: alignmentCharactersPerLine,
    score: data.align1score ? data.align1score : undefined
  })

  const alt2 = {
    sequence: ungapped(data.alt2align),
    alignmentString: data.alt2align,
    isReverseComplement: false,
    chromosome: 'Alt2',
    startPosition: 1,
    label: 'Alt2',
    alleleFraction: data.allele2fraction
  }

  const ref2 = {
    sequence: ungapped(data.ref2align),
    alignmentString: data.ref2align,
    isReverseComplement: data.ref2forward === 0,
    chromosome: data.ref2chr,
    startPosition: data.ref2pos,
    label: 'Ref'
  }

  renderAlignmentChart(alignmentChart2, {
    alt: alt2,
    ref: ref2,
    charactersPerLine: alignmentCharactersPerLine,
    score: data.align2score ? data.align2score : undefined
  })

  alt1.alignmentString = data.allele1align
  alt2.alignmentString = data.allele2align

  renderAlignmentChart(alignmentChart3, {
    alt: alt1,
    ref: alt2,
    charactersPerLine: alignmentCharactersPerLine,
    score: data.align3score ? data.align3score : undefined
  })

  renderVariantsTable(variantsTable, data.variants)
}

function convertTraceData(data) {
  const peaks = zip(data.pos, data.peakA, data.peakC, data.peakG, data.peakT)

  const ret = []
  const baseCallPat = /(\d+):([A-Z|]+)/

  for (const [pos, peakA, peakC, peakG, peakT] of peaks) {
    const record = {
      position: pos,
      peaks: {
        A: peakA,
        C: peakC,
        G: peakG,
        T: peakT
      },
      calls: null
    }
    const baseCall = data.basecalls[pos]
    if (baseCall) {
      const match = baseCallPat.exec(baseCall)
      const [, pos, bases] = match
      // FIXME (temporary) tracy won't output these in the future
      if (!isDna(bases.replace(/\|/g, ''))) continue
      record.calls = {
        pos: +pos,
        bases: bases.split('|')
      }
    }
    ret.push(record)
  }
  return ret
}

function renderTraceChart(container, data, chartConfig, title) {
  const traces = []
  const calls = []

  const colors = {
    A: '#4daf4a',
    C: '#377eb8',
    G: '#212121',
    T: '#e41a1c'
  }

  for (const base of ['A', 'C', 'G', 'T']) {
    calls.push({
      x: [],
      y: [],
      xaxis: 'x',
      yaxis: 'y2',
      name: base,
      mode: 'markers',
      hoverinfo: 'x+text',
      text: [],
      marker: {
        color: colors[base],
        size: 10
      }
    })
    traces.push({
      x: data.map(rec => rec.position),
      y: data.map(rec => rec.peaks[base]),
      name: base,
      mode: 'lines',
      line: {
        color: colors[base]
      }
    })
  }

  const baseCalls = data.filter(rec => rec.calls !== null)
  const baseToIndex = {
    A: 0,
    C: 1,
    G: 2,
    T: 3
  }
  for (const record of baseCalls) {
    for (const base of record.calls.bases) {
      const index = baseToIndex[base]
      calls[index].x.push(record.position)
      calls[index].y.push(base)
      calls[index].text.push(`${base} (pos ${record.calls.pos})`)
    }
  }

  const combined = calls.concat(traces)

  let xRange = [0, 500]
  if (
    chartConfig &&
    chartConfig.x &&
    chartConfig.x.axis &&
    chartConfig.x.axis.range
  ) {
    xRange = chartConfig.x.axis.range
  }

  const layout = {
    title: title || '',
    yaxis: {
      title: 'signal',
      domain: [0, 0.6]
    },
    yaxis2: {
      title: 'basecalls',
      domain: [0.7, 1],
      categoryorder: 'category descending'
    },
    xaxis: {
      title: 'Trace signal position',
      range: xRange,
      zeroline: false
    }
  }

  const config = {
    displayModeBar: true
  }

  Plotly.newPlot(container, combined, layout, config)
}

function renderDecompositionChart(container, data) {
  const trace = {
    x: data.x,
    y: data.y,
    mode: 'lines+markers'
  }

  const layout = {
    title: data.title || '',
    xaxis: {
      title: 'InDel length (bp)',
      zeroline: false
    },
    yaxis: {
      title: 'Decomposition error'
    }
  }

  const config = {
    displayModeBar: true
  }

  Plotly.newPlot(container, [trace], layout, config)
}

function renderAlignmentChart(container, data) {
  const { alt, ref, charactersPerLine, score } = data

  const html = `<pre>
${score ? `Alignment score: ${score}\n\n` : ''}${alignmentHtml(
    alt,
    ref,
    charactersPerLine
  )}
</pre>`

  container.innerHTML = html
}

function alignmentHtml(alt, ref, n) {
  const altSequenceChunked = chunked(alt.sequence, n + 20).join('\n')
  const refSequenceChunked = chunked(ref.sequence, n + 20).join('\n')

  const labelWidth = Math.max(alt.label.length, ref.label.length)

  const numberWidth = Math.max(
    String(alt.sequence.length).length,
    String(ref.startPosition + ref.sequence.length - 1).length
  )

  const alignmentChunked = chunkedAlignment(
    alt.alignmentString,
    ref.alignmentString,
    n
  )

  let pos1 = 1
  let pos2 = ref.isReverseComplement
    ? ref.startPosition + ref.sequence.length - 1
    : ref.startPosition

  let alignmentChunkedFormatted = ''
  alignmentChunked.forEach(([seq1, matches, seq2]) => {
    alignmentChunkedFormatted += `${alt.label.padStart(labelWidth)}  ${String(
      pos1
    ).padStart(numberWidth)} ${seq1}\n${' '.repeat(
      labelWidth + numberWidth + 2
    )} ${matches}\n${ref.label.padStart(labelWidth)}  ${String(pos2).padStart(
      numberWidth
    )} ${seq2}\n\n`
    pos1 += ungapped(seq1).length
    if (ref.isReverseComplement) {
      pos2 -= ungapped(seq2).length
    } else {
      pos2 += ungapped(seq2).length
    }
  })

  return `>${alt.chromosome}:${alt.startPosition}-${alt.startPosition +
    alt.sequence.length -
    1}${alt.isReverseComplement ? '_reverse' : '_forward'}${
    alt.alleleFraction
      ? ` (Estimated allelic fraction: ${alt.alleleFraction})`
      : ''
  }
${altSequenceChunked}

>${ref.chromosome}:${ref.startPosition}-${ref.startPosition +
    ref.sequence.length -
    1}${ref.isReverseComplement ? '_reverse' : '_forward'}${
    ref.alleleFraction
      ? ` (Estimated allelic fraction: ${ref.alleleFraction})`
      : ''
  }
${refSequenceChunked}

${alignmentChunkedFormatted}`
}

function chunked(seq, n) {
  const ret = []
  for (let i = 0; i < seq.length; i += n) {
    ret.push(seq.slice(i, i + n))
  }
  return ret
}

function chunkedAlignment(str1, str2, n) {
  const ret = []
  for (const [line1, line2] of zip(chunked(str1, n), chunked(str2, n))) {
    let matchString = ''
    for (const [char1, char2] of zip(line1, line2)) {
      matchString += char1 === char2 ? '|' : ' '
    }
    ret.push([line1, matchString, line2])
  }
  return ret
}

function renderVariantsTable(container, variants) {
  const html = `
    <table class="table table-sm table-striped table-hover">
      <thead>
        <tr>
          <th scope="col"></th>
          ${variants.columns
            .map(title => `<th scope="col">${title}</th>`)
            .join('')}
        </tr>
      </thead>
      <tbody>
        ${variants.rows
          .map(
            (row, i) => `<tr>
            <td title="Show in trace viewer">
              <i
                class="fas fa-chart-line"
                style="cursor: pointer"
                onclick="showVariantInViewer(${i})"
              ></i>
            </td>
            ${row
              .map(
                (value, j) => `<td title="${variants.columns[j]}">${value}</td>`
              )
              .join('')}
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  `
  container.innerHTML = html

  function showVariantInViewer(index) {
    Plotly.relayout(traceChart, {
      'xaxis.range': variants.xranges[index]
    })
    traceChart.scrollIntoView()
  }

  window.showVariantInViewer = showVariantInViewer
}

function zip() {
  const ret = []
  for (let i = 0; i < arguments[0].length; i += 1) {
    const record = [arguments[0][i]]
    for (let j = 1; j < arguments.length; j += 1) {
      record.push(arguments[j][i])
    }
    ret.push(record)
  }
  return ret
}

function isDna(seq) {
  const dnaPat = /^[acgt]+$/i
  return dnaPat.test(seq)
}

function ungapped(seq) {
  return seq.replace(/-/g, '')
}

function showExample() {
  resultLink.click()
  const formData = new FormData()
  formData.append('showExample', 'showExample')
  hideElement(resultContainer)
  hideElement(resultError)
  showElement(resultInfo)
  axios
    .post(`${API_URL}/upload`, formData)
    .then(res => {
      if (res.status === 200) {
        handleSuccess(res.data.data)
      }
    })
    .catch(err => {
      let errorMessage = err
      if (err.response) {
        errorMessage = err.response.data.errors
          .map(error => error.title)
          .join('; ')
      }
      hideElement(resultInfo)
      showElement(resultError)
      resultError.querySelector('#error-message').textContent = errorMessage
    })
}

window.downloadBcf = downloadBcf
function downloadBcf() {
  // TODO: better bcf file name
  saveAs(`${API_URL}/${downloadUrl}/bcf`, 'indigo-variants.bcf')
}

window.handleTocChange = handleTocChange
function handleTocChange(select) {
  const targetId = select.value
  if (targetId !== '#') {
    document.getElementById(targetId).scrollIntoView()
    select.value = '#'
  }
}

function showElement(element) {
  element.classList.remove('d-none')
}

function hideElement(element) {
  element.classList.add('d-none')
}
