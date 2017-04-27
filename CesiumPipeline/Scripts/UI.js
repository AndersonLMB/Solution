/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/template.js" />
/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/jquery-3.2.1.js" />

var assertTemplates = function () {
    var tpl = "";
    $.ajax({
        url: "Templates/UI.txt",
        method: "GET",
        async: false,
        success: function (tpl) {
            tpl = tpl;
        }
    });
    renderUI();
    renderHeadbar();
    renderFunctionBar();
};

var renderUI = function () {

}

var renderHeadbar = function () {
}

var renderFunctionBar = function () {
}

assertTemplates();

