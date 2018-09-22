const API_URL = process.env.API_URL

const targetGenomes = document.getElementById('target-genome')

document.addEventListener("DOMContentLoaded", function() {
  // Send different data to avoid caching
  var dt = new Date();
  var utcDate = dt.toUTCString();
  const formData = new FormData()
  formData.append('stufferData', formData)
  axios
    .post(`${API_URL}/genomeindex`, formData)
    .then(res => {
	if (res.status === 200) {
          handleSuccess(res.data)
      }
    })
    .catch(err => {
      let errorMessage = err
      if (err.response) {
        errorMessage = err.response.data.errors
          .map(error => error.title)
          .join('; ')
      }
      alert("Error loading genomeindex-index: " + errorMessage);
    })
});

async function handleSuccess(res) {
  var rhtml = '<select class="form-control" id="genome-select">\n'
  for (var i = 0; i < res.length; i++) {
    rhtml += '  <option value="' + res[i].file + '"'
    if (res[i].preselect == true) {
      rhtml += ' selected'
    }
    rhtml += '>' + res[i].name + '</option>\n'
  }
  rhtml += '</select>\n'
  targetGenomes.innerHTML = rhtml
}


