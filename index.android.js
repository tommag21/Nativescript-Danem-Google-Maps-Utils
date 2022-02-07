"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils = require("@nativescript/core/utils");
var ClusterManager = com.google.maps.android.clustering.ClusterManager;
var DefaultClusterRenderer = com.google.maps.android.clustering.view.DefaultClusterRenderer;
var HeatmapTileProvider = com.google.maps.android.heatmaps.HeatmapTileProvider;
var TileOverlayOptions = com.google.android.gms.maps.model.TileOverlayOptions;
var Gradient = com.google.maps.android.heatmaps.Gradient;
var _mapView = {};
var heatmaps = {
    provider: "",
    overlay: "",
}
var imageModule = require("@nativescript/core/ui/image");
var imageSourceModule = require('@nativescript/core/image-source');

function moveCamera(latitude, longitude) {
    if (_mapView.gMap === undefined) {
        console.log("NO INIT MAPVIEW")
    } else {
        try {
            var cameraUpdate = new com.google.android.gms.maps.CameraUpdateFactory.newLatLng(new com.google.android.gms.maps.model.LatLng(latitude, longitude))
            _mapView.gMap.animateCamera(cameraUpdate)
        } catch (e) {
            console.log(e)
        }
    }

}
exports.moveCamera = moveCamera;

/***************************************** CLUSTERING *****************************************/

const CustomClusterItem = java.lang.Object.extend({
    interfaces: [com.google.maps.android.clustering.ClusterItem],
    marker: null,
    init: function () { },
    getMarker: function () {
        return this.marker;
    },
    getPosition: function () {
        return this.marker.position.android;
    },
    getTitle: function () {
        return this.marker.title;
    },
    getSnippet: function () {
        return this.marker.snippet;
    },
});

function setupMarkerCluster(mapView, markers) {
    _mapView = mapView
    const CustomClusterRenderer = DefaultClusterRenderer.extend({
        init: function () { },
        onBeforeClusterItemRendered: function (item, markerOptions) {
            this.super.onBeforeClusterItemRendered(item, markerOptions);

            var icon = item.marker.infoWindowTemplate;
            var value = null;
            if (typeof icon === 'string') {
                var resourceName = String(icon);
                var imageSource = imageSourceModule.ImageSource.fromResourceSync(resourceName);
                if (imageSource) {
                    var image = new imageModule.Image();
                    image.imageSource = imageSource;
                    value = image;
                }
            }
            var androidIcon = (value) ? com.google.android.gms.maps.model.BitmapDescriptorFactory.fromBitmap(value.imageSource.android) : null;
            markerOptions.icon(androidIcon);
        }
    });
    var clusterManager = new ClusterManager(utils.ad.getApplicationContext(), _mapView.gMap);
    var renderer = new CustomClusterRenderer(utils.ad.getApplicationContext(), _mapView.gMap, clusterManager);
    clusterManager.mapView = _mapView;
    if (_mapView.gMap.setOnCameraIdleListener) {
        _mapView.gMap.setOnCameraIdleListener(clusterManager);
    }
    else if (_mapView.gMap.setOnCameraChangeListener) {
        _mapView.gMap.setOnCameraChangeListener(clusterManager);
    }
    clusterManager.setRenderer(renderer);
    _mapView.gMap.setOnInfoWindowClickListener(clusterManager);
    _mapView.gMap.setOnMarkerClickListener(clusterManager);

    clusterManager.setOnClusterItemClickListener(new ClusterManager.OnClusterItemClickListener({
        onClusterItemClick: function (gmsMarker) {
            var marker = markers.find(mk => mk.android.getPosition() === gmsMarker.getPosition());
            marker && _mapView.notifyMarkerTapped(marker);
            return false;
        }
    }));

    clusterManager.setOnClusterItemInfoWindowClickListener(new ClusterManager.OnClusterItemInfoWindowClickListener({
        onClusterItemInfoWindowClick: function (gmsMarker) {
            var marker = markers.find(mk => mk.android.getPosition() === gmsMarker.getPosition());
            marker && _mapView.notifyMarkerTapped(marker);
            return false;
        }
    }));

    clusterManager.setOnClusterClickListener(new ClusterManager.OnClusterClickListener({
        onClusterClick: function (cluster) {
            var listeMarker = cluster.getItems().toArray();
            var resultListeMarkers = [];
            for (var i = 0; i < listeMarker.length; i++) {
                resultListeMarkers.push(markers.find(mk => mk.android.getPosition() === listeMarker[i].getPosition()))
                if (i === listeMarker.length - 1) {
                    _mapView.notifyMarkerTapped(resultListeMarkers);
                    return false;
                }
            }
        }
    }));

    var arrayMarker = new java.util.ArrayList()
    for (var i = 0; i < markers.length; i++) {
        var markerItem = new CustomClusterItem();
        markerItem.marker = markers[i];
        arrayMarker.add(markerItem)
        if (i === markers.length - 1) {
            clusterManager.addItems(arrayMarker)
        }
    }
    clusterManager.cluster();
}
exports.setupMarkerCluster = setupMarkerCluster;

function clearMap() {
    _mapView.gMap.clear()
}
exports.clearMap = clearMap;

/***************************************** HEATMAP *****************************************/

function setupHeatmap(mapView, positions, colors, startPoints) {
    var list = new java.util.ArrayList();
    positions.forEach(function (position) {
        list.add(position.android);
    });
    var colrs = Array.create("int", 2);
    colrs[0] = colors[0].android;
    colrs[1] = colors[1].android;
    var sttPoints = Array.create("float", 2);
    sttPoints[0] = startPoints[0];
    sttPoints[1] = startPoints[1];
    var gradient = new Gradient(colrs, sttPoints);
    heatmaps.provider = new HeatmapTileProvider.Builder()
        .data(list)
        .gradient(gradient)
        .build();
    heatmaps.overlay = mapView.gMap.addTileOverlay(new TileOverlayOptions().tileProvider(heatmaps.provider));
    return heatmaps
}
exports.setupHeatmap = setupHeatmap;

function setOpacity(value) {
    heatmaps.provider.setOpacity(value)
}
exports.setOpacity = setOpacity;

function setRadius(value) {
    heatmaps.provider.setRadius(value)
}
exports.setRadius = setRadius;

function removeHeatmap() {
    heatmaps.provider.remove()
}
exports.removeHeatmap = removeHeatmap;
//# sourceMappingURL=index.android.js.map
