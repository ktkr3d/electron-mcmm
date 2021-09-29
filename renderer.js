// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
document.getElementById('in_s_02').addEventListener('click', () => {
  window.api.SelectDir();
});

document.getElementById('in_s_04').addEventListener('click', () => {
  window.api.OpenDir();
});

const text_form = document.getElementById('text-01');
text_form.addEventListener('keypress', searc_mods);
function searc_mods(e) {
  //const data = [];
  if (e.keyCode === 13) {
    window.api.SearchMods(text_form.value).then((result) => {
      console.log(result);
    });
  }
  return false;
}

const replaceHTML = (selector, text) => {
  const element = document.getElementById(selector);
  if (element) element.innerHTML = text;
};

window.onload = () => {
  window.api.RefreshMyModsList();
  window.api.RefreshMyShaderpacksList();
  window.api.RefreshMyResourcepacksList();
};

window.api.DisplayMyModsList((mods_list) => {
  var my_mods_list_html = '';
  for (const elem of mods_list) {
    my_mods_list_html +=
      '<tr><td><a href="' +
      elem.url +
      '">' +
      elem.name +
      '</a></td><td>' +
      elem.description +
      '</td><td>' +
      elem.version +
      '</td><td>' +
      elem.mc_version +
      '</td></tr>';
  }
  replaceHTML('table-m-tbody', my_mods_list_html);
  $('#table-m').trigger('update');
});

window.api.DisplayMyShaderpacksList((list) => {
  var list_html = '';
  for (const elem of list) {
    list_html += '<tr><td>' + elem + '</td></tr>';
  }
  replaceHTML('table-s-tbody', list_html);
  $('#table-s').trigger('update');
});

window.api.DisplayMyResourcepacksList((list) => {
  var list_html = '';
  for (const elem of list) {
    list_html += '<tr><td>' + elem.name + '</td><td>' + elem.description + '</td></tr>';
  }
  replaceHTML('table-r-tbody', list_html);
  $('#table-r').trigger('update');
});

window.api.DisplaySearchResults((list) => {
  var list_html = '';
  for (const elem of list) {
    list_html +=
      '<tr><td><a href="' +
      elem.url +
      '">' +
      elem.name +
      '</a></td><td>' +
      elem.summary +
      '</td><td class="number">' +
      elem.downloads +
      '</td><td>' +
      elem.updated +
      '</td><td>' +
      elem.minecraft +
      '</td></tr>';
  }
  replaceHTML('table-c-tbody', list_html);
  $('#table-c').trigger('update');
});
