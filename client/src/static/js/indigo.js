$('#mainTab a').on('click', function(e) {
  e.preventDefault()
  $(this).tab('show')
})

const resultLink = document.getElementById('link-results')

const submitButton = document.getElementById('btn-submit')
submitButton.addEventListener('click', function() {
  resultLink.click()
  run()
})

const exampleButton = document.getElementById('btn-example')
// exampleButton.addEventListener('click', loadExample)

const inputFile = document.getElementById('inputFile')
const targetFastaFile = document.getElementById('targetFileFasta')
const targetChromatogramFile = document.getElementById('targetFileChromatogram')
const targetGenomes = document.getElementById('target-genome')
const targetTabs = document.getElementById('target-tabs')

function run() {
  const formData = new FormData()

  if (inputFile.files.length === 0) {
    // TODO error message
    return
  }

  formData.append('queryFile', inputFile.files[0])

  const target = targetTabs.querySelector('a.active').id

  if (target.startsWith('target-genome')) {
    const genome = targetGenomes.querySelector('option[selected]').textContent
    formData.append('genome', genome)
  } else if (target.startsWith('target-fasta')) {
    if (targetFastaFile.files.length === 0) {
      // TODO error message
      return
    }
    formData.append('fastaFile', targetFastaFile.files[0])
  } else if (target.startsWith('target-chromatogram')) {
    if (targetChromatogramFile.files.length === 0) {
      // TODO error message
      return
    }
    formData.append('chromatogramFile', targetChromatogramFile.files[0])
  }

  axios.post(
    'http://localhost:3300/api/v1/upload',
    formData
  ).then(res => {
    console.log('POST /upload returned', data)
  }).catch(err => {
    console.error(err)
  })
}
