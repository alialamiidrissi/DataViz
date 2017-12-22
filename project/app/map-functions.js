
import * as help from './helpers' ;
import * as _ from 'underscore';
import L from 'leaflet';
import * as chroma from 'chroma-js';
import * as d3 from 'd3';
import {addFilter,filter} from './main';
/*********************************************Variables Initialization**********************************************/
// json object mapping countries to citizenships
let g_json;

// Hold the number of students from each country
let groupped_nationalities;

// The currently selected country
export let country;

// Map variable
export let map = L.map('map').setView([51.505, -0.09], 0);
map.setZoom(1)
export let info = L.control();
map.options.minZoom = 1;

// Map scale
let scale;
//Color scale
let get_color = x => chroma.scale(['#fee5d9', '#a50f15']).classes(scale)(x).hex();
// map Legend creation
let legend = L.control({
    position: 'bottomleft'
});

legend.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info legend');
    this.update()
    return this._div;
};

legend.update = function(color, scale) {
    if (color) {
        this._div.innerHTML = ''
        // loop through our density intervals and generate a label with a colored square for each interval

        for (let i = 0; i < scale.length - 1; i++) {
            this._div.innerHTML +=
                '<i style="background:' + color(scale[i]) + '"></i> ' +
                (help.round5(scale[i])) + ((help.round5(scale[i + 1])) ? '&ndash;' + (help.round5(scale[i + 1])) + '<br>' : '+');
        }
    }

}

legend.addTo(map);

//Functions for adding countries infos banner(The text that appears when we hover over a country)
info.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info_legend'); // create a div with a class "info"
    this.update();
    return this._div;
};

// Function used to display the number of student coming from a certain country
info.update = function(props) {
    this._div.innerHTML = '<h4> Country</h4>'
    this._div.innerHTML += (props ? '<b>' + props[0] + '</b><br />' + (props[1] ? props[1] : 0) + ' student' :
        'Hover over a country')
};

info.addTo(map);

/***************************************************Functions*******************************************************/


export function updateMap(data) {
    /***Function used to update the  map***/


    // group data by citizenship and update information panel
    groupped_nationalities = _.countBy(data, (x) => x['Nationalité']);
    if ('Nationalité' in filter &&
        filter['Nationalité'] != '' && filter['Nationalité']) {
        let arr = [country, groupped_nationalities[filter['Nationalité']]]
        info.update(arr);
        country= help.citizenships_countries[filter['Nationalité']]
    } else {
        // change the map scale if no country is selected
        let values = _.map(groupped_nationalities, (v, k) => parseFloat(v)).sort(help.numberSort)
        scale = chroma.limits(values, 'l', 5);
        country = null;
        info.update()
    }

    // load geoJson file and display the map if this was never done before

    if (g_json != undefined) {
        g_json.setStyle(style(groupped_nationalities, get_color));
    } else {
        d3.json("./data/custom.geo.json", function(geojson) {
            // bind map with data and set style
            g_json = L.geoJson(geojson, {
                onEachFeature: onEachFeature
            }).addTo(map);
            g_json.setStyle(style(groupped_nationalities, get_color));
            map.invalidateSize();

        });
    }
    legend.update(get_color, scale)



}




function style(data, scale) {
    /***Styling funtion for the map elements***/
    return function(feature) {
        let nb_value = fetch_value(feature, data)

        let style_ = {
            fill: true,
            fillColor: (((country == help.citizenships_countries[fetch_nationality(feature)]) || !country) && nb_value > 0) ? scale(nb_value) : '#d9d9d9',
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '1',
            fillOpacity: 1
        };

        return style_;
    }
}

function fetch_value(feature, data) {
    // fetch number of students for the selected country (feature)
    let nb_value = 0
    if (feature.properties['wb_a2'] != -99)
        nb_value = (data[help.codes_mapping[feature.properties['wb_a2']]])
    else
        nb_value = (data[help.codes_mapping[feature.properties['postal']]])
    return nb_value
}

function fetch_nationality(feature) {
    // fetch nationality denomination using the ISO code provided by leaflet
    let nationality = ''
    if (feature.properties['wb_a2'] != -99)
        nationality = (feature.properties['wb_a2'])
    else        
        nationality = (feature.properties['postal'])

    if(nationality == 'CN'){
        if(feature.properties.sovereignt == 'China')
            nationality = 'Chinese'
        else
            nationality = 'Northern Cypriot'
    }
    else
        nationality = help.codes_mapping[nationality]
    return nationality
}

function highlightFeature() {
    // highlight country when hovering over it and update the info banner
    return (e) => {
        let layer = e.target;


        if (!('Nationalité' in filter && filter['Nationalité'] != '' && filter['Nationalité'])) {
            let arr = [help.citizenships_countries[fetch_nationality(layer.feature)], fetch_value(layer.feature, groupped_nationalities)]
            info.update(arr);
        }

        layer.setStyle({
            weight: 3,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });


        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
    };
}

function onEachFeature(feature, layer) {
    /** function used to define the functions to be called clicks and hoverings over
    the map are detected **/
    return layer.on({
        mouseover: highlightFeature(),
        mouseout: resetHighlight(),
        click: selectNationality
    });

}



function selectNationality(e) {
    // Function triggered when a country is selected.
    // Zoom over the country and add it to the nationality filter 
    let nationality = fetch_nationality(e.target.feature);
    if (filter['Nationalité'] != nationality) {
        country = help.citizenships_countries[nationality]
        addFilter('Nationalité', nationality);
        map.fitBounds(e.target.getBounds());
    }
    else{

        country = null;
        addFilter('Nationalité', null);
        map.setView([51.505, -0.09], 1.3);

    }

}

function resetHighlight() {

    // reset map style and countries info banner

    return (e) => {
        e.target.setStyle({
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '1',
            fillOpacity: 1
        });
        if ('Nationalité' in filter &&
            (filter['Nationalité'] != '') && (filter['Nationalité'] != null)  )
            return
        info.update();


    }

}
