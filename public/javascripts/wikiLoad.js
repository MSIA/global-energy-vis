function wikiLoad(country) {
  $.ajax({
    type: "GET",
    url: `https://en.wikipedia.org/api/rest_v1/page/summary/${country}`,
    contentType: "application/json; charset=utf-8",
    dataType: "json",
  }).done(r => $('#wiki').append(r.extract_html));
};