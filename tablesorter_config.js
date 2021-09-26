$(document).ready(function () {
  $('#table-m').tablesorter();
  $('#table-s').tablesorter();
  $('#table-r').tablesorter();
  $('#table-c').tablesorter({
    headers: {
      0: { sorter: 'text' },
      1: { sorter: 'text' },
      2: { sorter: 'digit' },
    },
  });
});
