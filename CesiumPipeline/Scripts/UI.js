/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/template.js" />
/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Lib/jquery-3.2.1.js" />
/// <reference path="Application.js" />
/// <reference path="C:\Users\ander\documents\visual studio 2015\Projects\Solution\CesiumPipeline\Cesium/Cesium.js" />

var assertTemplates = function () {
    var tpl = "";
    var result = null;
    jQuery.ajax({
        url: "http://localhost/CesiumPipeline/Templates/UI.html",
        method: "GET",
        async: false,
        success: function (rs) { result = rs; }
    });
    jQuery("head").append(result);
    renderUI();
    renderHeadbar();
    renderFunctionBar();
    renderResourcesBar();
};

var renderUI = function () {
}

var renderHeadbar = function () {
    var data = {};
    var html = "";
    html = template("headbar", data);
    jQuery("body").append(html);
}

var renderFunctionBar = function () {

}
var data = {
    resources: [
        {
            "type": "terrainSelector",
            "title": "地形服务",
            "options": [
                {
                    "title": "STK地形服务",
                    "val": "STK_Terrain",
                    "url": "https://assets.agi.com/stk-terrain/world",
                },
                {
                    "title": "本地1",
                    "val": "Local_Terrain",
                    "url": "",
                }
            ]
        },
{
    "type": "WMTSSelector",
    "title": "WMTS服务",
    "options": [
        {
            "title": "ArcGIS Online",
            "val": "ArcGIS_WMTS",
            "url": "",
        },
        {
            "title": "OSM",
            "val": "OSM_WMTS",
            "url": "",
        },

    ]
},
    ],
    data: {
        "PSGX": {
            title: "攀枝花排水管线",
            abbr: "PSGX",
            type: "Polyline",
            url: "http://localhost:6080/arcgis/rest/services/PZH/PZH_test2/FeatureServer/1",
        },
        //"PSGD": {
        //    title: "攀枝花排水管点",
        //    abbr: "PSGD",
        //    type: "Point",
        //    url: "http://localhost:6080/arcgis/rest/services/PZH/PZH_test/MapServer/2",
        //},
        "RQGX": {
            title: "攀枝花燃气管线",
            abbr: "RQGX",
            type: "Polyline",
            url: "http://localhost:6080/arcgis/rest/services/PZH/PZH_test2/FeatureServer/0",
        },
    },
    analysis: [
        {
            title: "碰撞分析",

        }
    ],
};

var entities = {};

jQuery.each(data.data, function (i, o) {
    //entities[o.abbr] = data.data[o.abbr];
    entities[o.abbr] = entitiesFromServer(data.data[o.abbr].url);
});

var renderResourcesBar = function () {

    var html = "";
    html = template("resourcesbar", data);
    jQuery("body").append(html);
};

assertTemplates();

//WMTS选择器
jQuery(".WMTSSelector").change(function () {
    imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(resources[jQuery(".WMTSSelector").val()]);
    //viewer.imageryLayers = resources[jQuery(".WMTSSelector").val()];
});

//地形服务选择器
jQuery(".terrainSelector").change(
    function () {
        viewer.terrainProvider = resources[jQuery(".terrainSelector").val()];
    });

jQuery(".collision-apply").click(
    function () {
        collisionCheck();
    });

var renderCollisionResults = function (results) {
    var obj = {
        "results": results,
    }
    var html = template("resultsbar", obj);
    if (jQuery(".resultsbar-container").length == 0) {
        $("body").append(html);
        $(".resultsbar-close").click(function () {
            $(".resultsbar-container").remove();
        });
    }
}

//绑定checkbox change事件
jQuery.each(data.data, function (i, o) {
    jQuery(".data-check-" + o.abbr).change(function (thi) {
        if (this.checked === true) {
            //console.log(this);
            loadEntities(entities[this.value]);
        }
        else {
        }
    });
});

var isCN = function (temp) {
    var re = /[^\u4e00-\u9fa5]/;
    if (re.test(temp)) return false;
    return true;
}

var isNum = function (temp, fields) {
    var result;
    jQuery.each(fields, function (i, o) {
        if (temp === o.name) {
            if (o.type != "esriFieldTypeString") {
                result = true;
            }
            else {
                result = false
            }
        }

    });
    return result;
}

//渲染编辑器面板
//id:objectid
var renderEditor = function (id, url) {
    var result;
    var data = { "attributes": "" };
    var attributes = jQuery.ajax({
        url: url + "/query",
        method: "GET",
        async: false,
        data: {
            where: "OBJECTID_1=" + id,
            outFields: "*",
            returnZ: true,
            f: "pjson"
        },
        success: function (rs) { result = rs; },
    });
    result = JSON.parse(result);
    data.attributes = result.fields;
    jQuery.each(data.attributes, function (i, o) {
        o.val = result.features[0].attributes[o.name];
        if (isCN(o.name)) {
            o.display = true;
        }
    });
    var html = template("editor", data);
    jQuery("body").append(html);
    jQuery(".editor-apply").click(function () {
        executeEdit(id, result.fields, url);
    });
    jQuery(".editor-close").click(function () {
        jQuery(".editor-container").remove()
    });
}

//执行编辑
var executeEdit = function (id, fields, url) {
    var Attributes = [];
    jQuery.each(fields, function (i, o) {
        Attributes.push(o.name);
    });
    var cnAttributes = [];
    var data = {};
    jQuery.each(Attributes, function (i, o) {
        if (isCN(o)) {
            cnAttributes.push(o);
        }
    });
    jQuery.each(cnAttributes, function (i, o) {
        if (isNum(o, fields)) {
            data[o] = Number(jQuery(".editor-val-" + o).html());
        }
        else {
            data[o] = jQuery(".editor-val-" + o).html();
        }
        if (jQuery(".editor-val-" + o).html() === " ") {
            data[o] = "";
        }
    });
    data["OBJECTID_1"] = id;
    var features = "[{\"attributes\":" + JSON.stringify(data) + "}]";
    jQuery.ajax({
        url: url + "/updateFeatures",
        method: "POST",
        async: false,
        data: {
            f: "pjson",
            features: features,
        },
        success: function (rs) {
            if (JSON.parse(rs).updateResults[0].success == true) {
                jQuery(".editor-result").html("OBJECTID_1:" + JSON.parse(rs).updateResults[0].objectId + "更新成功");
            }
        }
    });
}

//选取entity
var scene = viewer.scene;
var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
var pickedObject;
handler.setInputAction(function (movement) {
    pickedObject = scene.pick(movement.position);
    if (Cesium.defined(pickedObject)) {
        if (jQuery(".editor-container").length === 0) {
            renderEditor(pickedObject.id.id, pickedObject.id.url)
        } else {
        }
    }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK)



