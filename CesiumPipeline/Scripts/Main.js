//var viewer = new Cesium.Viewer('cesiumContainer');

var terrainProvider = new Cesium.CesiumTerrainProvider({ url: "http://localhost/CesiumPipeline/canton" });
var viewer = new Cesium.Viewer("cesiumContainer", {
    baseLayerPicker: false,
    terrainProvider: terrainProvider,
    imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer'
    }),
});

