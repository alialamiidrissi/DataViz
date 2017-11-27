import * as d3 from 'd3-3';
import * as _ from 'underscore';
import Slider from "@flourish/slider";
import L from 'leaflet';
import * as c3 from 'c3';
import * as help from './helpers';
import * as chroma from 'chroma-js';
import Chart from 'chart.js'

let chroma_colors = chroma.scale('OrRd').classes(5);
let groupped_nationalities;
let country;

require("./main.css");

/*************   ALAMI   *************/
const codes_mapping = {
    "AD": "Andorran",
    "AE": "Emirian",
    "AF": "Afghan",
    "AG": "Antiguan",
    "AI": "Anguillan",
    "AL": "Albanian",
    "AM": "Armenian",
    "AO": "Angolan",
    "AQ": "Antarctic",
    "AR": "Argentinian",
    "WS": "Samoan",
    "AT": "Austrian",
    "AU": "Australian",
    "AW": "Arubian",
    "AX": "\u00c5landic",
    "AZ": "Azerbaijani",
    "BA": "Bosnian",
    "BB": "Barbadian",
    "BD": "Bangladeshi",
    "BE": "Belgian",
    "BF": "Burkinabe",
    "BG": "Bulgarian",
    "BH": "Bahrainian",
    "BI": "Burundian",
    "BJ": "Beninese",
    "BL": "Barth\u00e9lemois",
    "BM": "Bermudan",
    "BN": "Bruneian",
    "BO": "Bolivian",
    "VA": NaN,
    "BR": "Brazilian",
    "BS": "Bahameese",
    "BT": "Bhutanese",
    "BW": "Motswana",
    "BY": "Byelorussian",
    "BZ": "Belizean",
    "CA": "Canadian",
    "CC": "Cocossian",
    "CG": "Congolese",
    "CF": "Central African",
    "CH": "Swiss",
    "CI": "Ivorian",
    "CK": "Cook Islander",
    "CL": "Chilean",
    "CM": "Cameroonian",
    "CN": "Chinese",
    "CO": "Colombian",
    "CR": "Costa Rican",
    "CU": "Cuban",
    "CV": "Cape Verdean",
    "CW": "Cura\u00e7aoan",
    "CX": "Christmas Islander",
    "CY": "Cypriot",
    "CZ": "Czech",
    "DE": "German",
    "DJ": "Djiboutian",
    "DK": "Danish",
    "DO": "Dominican",
    "DZ": "Algerian",
    "EC": "Ecuadorian",
    "EE": "Estonian",
    "EG": "Egyptian",
    "EH": "Western Saharan",
    "ER": "Eritrean",
    "ES": "Spanish",
    "ET": "Ethiopian",
    "FI": "Finnish",
    "FJ": "Fijian",
    "FK": "Falkland Islander",
    "FM": "Micronesian",
    "FO": "Faroese",
    "FR": "French",
    "GA": "Gabonese",
    "GB": "British",
    "GD": "Grenadian",
    "GE": "Georgian",
    "GF": "French Guianese",
    "GH": "Ghanaian",
    "GI": "Gibralterian",
    "GL": "Greenlander",
    "GM": "Gambian",
    "GW": "Guinean",
    "GP": "Guadeloupean",
    "GQ": "Equatorial Guinean",
    "GR": "Greek",
    "GT": "Guatemalan",
    "GU": "Guamanian",
    "GY": "Guyanese",
    "HK": "Hong Konger",
    "HN": "Honduran",
    "HR": "Croatian",
    "HT": "Haitian",
    "HU": "Hungarian",
    "ID": "Indonesian",
    "IE": "Irish",
    "IL": "Israeli",
    "IM": "Manx",
    "IN": "Indian",
    "IQ": "Iraqi",
    "IR": "Iranian",
    "IS": "Icelandic",
    "IT": "Italian",
    "JM": "Jamaican",
    "JO": "Jordanian",
    "JP": "Japanese",
    "KE": "Kenyan",
    "KG": "Kirghiz",
    "KH": "Cambodian",
    "KI": "I-Kiribati",
    "KM": "Comoran",
    "KN": "Kittian",
    "KP": "North Korean",
    "KR": "South Korean",
    "KW": "Kuwaiti",
    "KY": "Caymanian",
    "KZ": "Kazakh",
    "LA": "Laotian",
    "LB": "Lebanese",
    "LC": "Saint Lucian",
    "LI": "Liechtensteiner",
    "LK": "Sri Lankan",
    "LR": "Liberian",
    "LS": "Mosotho",
    "LT": "Lithuanian",
    "LU": "luxembourgish",
    "LV": "Latvian",
    "LY": "Libyan",
    "MA": "Moroccan",
    "MC": "Monaco",
    "MD": "Moldovan",
    "ME": "Montenegrin",
    "MG": "Malagasy",
    "MH": "Marshallese",
    "MK": "Macedonian",
    "ML": "Malian",
    "MM": "Myanmarese",
    "MN": "Mongolian",
    "MO": "Macanese",
    "MP": "Northern Mariana Islander",
    "MQ": "Martinican",
    "MR": "Mauritanian",
    "MS": "Montserratian",
    "MT": "Maltese",
    "MU": "Mauritian",
    "MV": "Maldivan",
    "MW": "Malawian",
    "MX": "Mexican",
    "MY": "Malaysian",
    "MZ": "Mozambican",
    "NaN": "Namibian",
    "NC": "New Caledonian",
    "NE": "Nigerien",
    "NF": "Norfolk Islander",
    "NG": "Nigerian",
    "NI": "Nicaraguan",
    "NL": "Dutch",
    "NO": "Norwegian",
    "NP": "Nepali",
    "NR": "Nauruan",
    "NU": "Niuean",
    "NZ": "New Zealander",
    "OM": "Omani",
    "PA": "Panamanian",
    "PE": "Peruvian",
    "PF": "French Polynesian",
    "PG": "Papua New Guinean",
    "PH": "Filipino",
    "PK": "Pakistani",
    "PL": "Polish",
    "PM": "Saint-Pierrais",
    "PN": "Pitcairn Islander",
    "PR": "Puerto Rican",
    "PS": "Palestinian",
    "PT": "Portuguese",
    "PW": "Palauan",
    "PY": "Paraguayan",
    "QA": "Qatari",
    "RO": "Romanian",
    "RS": "Serbian",
    "RU": "Russian",
    "RW": "Rwandan",
    "SA": "Saudi Arabian",
    "SB": "Solomon Islander",
    "SC": "Seychellois",
    "SS": "Sudanese",
    "SE": "Swedish",
    "SG": "Singapore",
    "SH": "Saint Helenian",
    "SI": "Slovenian",
    "SK": "Slovak",
    "SL": "Sierra Leonean",
    "SM": "Sanmarinese",
    "SN": "Senegalese",
    "SO": "Somalian",
    "SR": "Surinamer",
    "ST": "S\u00e3o Tomean",
    "SV": "Salvadorean",
    "SY": "Syrian",
    "SZ": "Swazi",
    "TC": "Turks and Caicos Islander",
    "TD": "Chadian",
    "TG": "Togolese",
    "TH": "Thai",
    "TJ": "Tajik",
    "TK": "Tokelauan",
    "TL": "Timorese",
    "TM": "Turkmen",
    "TN": "Tunisian",
    "TO": "Tongan",
    "TR": "Turkish",
    "TT": "Trinidadian",
    "TV": "Tuvaluan",
    "TW": "Taiwanese",
    "TZ": "Tanzanian",
    "UA": "Ukrainian",
    "UG": "Ugandan",
    "US": "American",
    "UY": "Uruguayan",
    "UZ": "Uzbek",
    "VC": "Saint Vincentian",
    "VE": "Venezuelan",
    "VI": "Virgin Islander",
    "VN": "Vietnamese",
    "VU": "Ni-Vanuatu",
    "WF": "Wallisian",
    "YE": "Yemeni",
    "YT": "Mahoran",
    "ZA": "South African",
    "ZM": "Zambian",
    "ZW": "Zimbabwean",
    "KV": "Kosovar"
}
let g_json;

//import 'style-loader!leaflet/dist/leaflet.css';
let myChart;
const color_init = {
    3: '#fcae91',
    2: '#fb6a4a',
    1: '#de2d26',
    0: '#a50f15'
}
let colors_bc;
var quantile = require('compute-quantile')

//Map variable
let colors = ['#fad9d3', '#f0baaf', '#e39a8d', '#d57c6c', '#c55b4c', '#b3392d', '#a00310']
let map = L.map('map').setView([51.505, -0.09], 1.4);
// L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png').addTo(map);
let info = L.control();
map.options.minZoom = 1;
let scale;
let get_color = x => chroma.scale(['#fcbba1', '#a50f15']).classes(scale)(x).hex();
// Legend creation
let legend = L.control({
    position: 'bottomleft'
});
// console.log(legend)

legend.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info legend');
    this.update()
    return this._div;
};

legend.update = function(color, scale) {
    if (color) {
        this._div.innerHTML = ''
            // loop through our density intervals and generate a label with a colored square for each interval

        for (var i = 0; i < scale.length - 1; i++) {
            this._div.innerHTML +=
                '<i style="background:' + color(scale[i]) + '"></i> ' +
                round5(scale[i]) + (round5(scale[i + 1]) ? '&ndash;' + round5(scale[i + 1]) + '<br>' : '+');
        }
    }

}

legend.addTo(map);

//Functions for adding countries infos banner
info.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info_legend'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function(props) {
    this._div.innerHTML = '<h4> Country</h4>'
    this._div.innerHTML += (props ? '<b>' + props[0] + '</b><br />' + (props[1] ? props[1] : 0) + ' student' :
        'Hover over a country')
};

info.addTo(map);


//Pie chart variables
var pie_faculty = null
var level_chart = null
var timeseries_chart = null
var original_data = null
var filter = {
    'Year': "2007-2008"
}


/********************************************* MAP FUNCTIONS *******************************************************/

let numberSort = function(a, b) {
    return a - b;
};

function round5(x) {
    return Math.ceil(x);
}

function updateMap(data) {

    // generate scale and groupped data
    groupped_nationalities = _.countBy(data, (x) => x['Nationalité']);
    if ('Nationalité' in filter &&
        filter['Nationalité'] != '') {
        let arr = [country, groupped_nationalities[filter['Nationalité']]]
        info.update(arr);
    } else {
        let values = _.map(groupped_nationalities, (v, k) => parseFloat(v)).sort(numberSort)
        scale = chroma.limits(values, 'l', 5);


    }

    if (g_json != undefined) {
        g_json.setStyle(style(groupped_nationalities, get_color));
    } else {
        d3.json("./data/custom.geo.json", function(geojson) {
            // bind map with data and set style
            g_json = L.geoJson(geojson, {
                onEachFeature: onEachFeature
            }).addTo(map);
            g_json.setStyle(style(groupped_nationalities, get_color));

        });
    }
    legend.update(get_color, scale)



}

function getColor(d, scale) {
    if (d == null)
        return '#e5e5e5'
    let color = d > scale[6] ? colors[6] :
        d > scale[5] ? colors[5] :
        d > scale[4] ? colors[4] :
        d > scale[3] ? colors[3] :
        d > scale[2] ? colors[2] :
        d > scale[1] ? colors[1] :
        colors[0];

    return color
}


function style(data, scale) {
    return function(feature) {
        let nb_value = fetch_value(feature, data)

        let style_ = {
            fill: true,
            fillColor: (country == feature.properties.sovereignt) || !country ? scale(nb_value) : '#e5e5e5',
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
    // fetch number of students
    let nb_value = 0
    if (feature.properties['wb_a2'] != -99)
        nb_value = (data[codes_mapping[feature.properties['wb_a2']]])
    else
        nb_value = (data[codes_mapping[feature.properties['postal']]])
    return nb_value
}

function fetch_nationality(feature) {
    // fetch number of students
    let nb_value = 0
    if (feature.properties['wb_a2'] != -99)
        nb_value = (codes_mapping[feature.properties['wb_a2']])
    else
        nb_value = (codes_mapping[feature.properties['postal']])
    return nb_value
}

function highlightFeature() {
    // highlight country when hoevering over it
    return (e) => {
        var layer = e.target;

        if (!('Nationalité' in filter && filter['Nationalité'] != '')) {
            let arr = [layer.feature.properties.sovereignt, fetch_value(layer.feature, groupped_nationalities)]
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
    return layer.on({
        mouseover: highlightFeature(),
        mouseout: resetHighlight(),
        click: selectNationality
    });

}



function selectNationality(e) {
    // zoom over country
    if ('Nationalité' in filter &&
        filter['Nationalité'] != '')
        return
    country = e.target.feature.properties.sovereignt
    map.fitBounds(e.target.getBounds());
    let nationality = fetch_nationality(e.target.feature);
    addFilter('Nationalité', nationality)
}

function resetHighlight() {

    // reset style and info banner

    return (e) => {
        e.target.setStyle({
            weight: 1,
            opacity: 1,
            color: 'white',
            dashArray: '1',
            fillOpacity: 1
        });
        if ('Nationalité' in filter &&
            filter['Nationalité'] != '')
            return
        info.update();


    }

}

/*******************************************************************************************************************/

function selectFaculty(d, i) {
    let key = 'faculty'
    if(dict_inkeys(filter, 'faculty') && filter['faculty'] != '')
        key = 'section'
    addFilter(key, d['id'])
}

function showSectionInfo(d, i) {
    // d3.select('.section_chart .c3-chart-arcs-title').node().innerHTML = format_number(d['value']) + '<div>' + 'Students' + '</div>' + Math.round(d['ratio'] * 100) + ' %';
    // d3.select('.section_chart .c3-chart-arcs-title').attr("transform", function(d, i) {
    //     var r = 30, //<-- adjust this to move the labels
    //         a = (d.startAngle + d.endAngle) / 2 - (Math.PI / 2);
    //     // compute the new centroid
    //     return "translate(" + (Math.cos(a) * r) + "," + (Math.sin(a) * r) + ")";
    // })
}

function show_sections(data) {
    let group_key = 'faculty'
    if ('faculty' in filter &&
        filter['faculty'] != '') {
        group_key = 'section'
    }
    let groupped_faculties =
        _.map(_.countBy(data, x => x[group_key]),
            (v, k) => [k, v])

    // console.log(groupped_faculties)
    if (pie_faculty != null) {
        pie_faculty.load({
            unload: true,
            columns: groupped_faculties
        })
        return
    }

    pie_faculty = c3.generate({
        bindto: '.section_chart',
        size: {
            height: 400,
            width: 300
        },
        data: {
            columns: groupped_faculties,
            type: 'donut',
            onclick: selectFaculty,
            onmouseover: showSectionInfo,
            onmouseout: (d, i) => {
                d3.select('.section_chart .c3-chart-arcs-title').node().innerHTML = ''
            }
        },
        donut: {
            label: {
                show: false
            },
            title: ""

        }
    });
    // console.log(pie_faculty, '0')
}

function format_number(n) {
    if (n < 1000)
        return Math.round(n)
    else
        return (parseFloat(n) / 1000).toFixed(1) + 'K'
}

function dict_inkeys(dict, str) {
    return Object.keys(dict).indexOf(str) > -1;
}

function show_timeseries_chart(data) {
    let timeseries = [
        ['Year'],
        ['Number of Students']
    ]
    let count_per_year = _.countBy(data, x => x['Year'])
    Object.keys(count_per_year).forEach((k) => {
        timeseries[0].push(k.substr(0, 4))
        timeseries[1].push(count_per_year[k])
    })

    // console.log(timeseries)

    // If exists -> update
    if (timeseries_chart != null) {
        //timeseries_chart.unload({ids:['Number of Students']})
        timeseries_chart.load({
            unload: true,
            columns: timeseries
        })
        return
    }

    // Initialise the timeseries chart
    timeseries_chart = c3.generate({
        bindto: '.timeseries_chart',
        size: {
            height: 100,
            width:1212
        },
        data: {
            x: 'Year',
            columns: timeseries
        },
        axis: {
            x: {
                show: false
            },
            y: {
                tick: {
                    format: format_number,
                    count: 3
                }
            }
        },
        legend: {
            show: false
        }
    });
}

function show_type(data) {

    let groupped_section = _.sortBy(_.filter(_.map(
        _.countBy(data, (x) => x['Type']),
        (v, k) => {
            return {
                'label': k,
                'data': [v]
            }
        }), (x) => ['Bachelor', 'Master', 'CMS', 'Exchange'].indexOf(x['label']) > -1), function(x) {
        return -x['data'][0];
    })
    let sorted_groupped_sections = _.map(
        groupped_section,
        x => {
            x['backgroundColor'] = colors_bc[x['label']];
            return x
        })
    // console.log(sorted_groupped_sections, 'DKKDK')

    if (myChart)
        myChart.destroy()
    let chartData = {
        type: 'horizontalBar',
        data: {
            datasets: sorted_groupped_sections
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            scales: {
                yAxes: [{
                    stacked: true
                }],
                xAxes: [{
                    stacked: true
                }]
            },
        }
    }
    var canvas = document.getElementById("level_chart")
    myChart = new Chart(canvas, chartData);
    // console.log(myChart.data)
    // console.log(sorted_groupped_sections, "ICI")
    canvas.onclick = function(evt) {
        var activePoint = myChart.getElementAtEvent(evt)[0];
        // console.log(activePoint)
        var data = activePoint._chart.config.data;
        var datasetIndex = activePoint._datasetIndex;
        var label = data.datasets[datasetIndex].label;
        addFilter('Type', label)
    };
}

function animateGender(selector, percentage) {
    let gradient_scale = d3.select(selector + ' svg #red_scale')
    gradient_scale.transition().duration(1000).attr('offset', 100 - percentage + '%');
}

function show_gender_ratio(data) {
    //TODO: Show only male and/or female depending on the filter

    // Group data by "Civilité"
    let groupped_gender = _.countBy(data, student => student['Civilité'])
    let tot_female = dict_inkeys(groupped_gender, 'Miss') ? groupped_gender['Miss'] : 0
    let tot_male = dict_inkeys(groupped_gender, 'Mister') ? groupped_gender['Mister'] : 0
    let percent_male = Math.round(tot_male * 100. / (tot_male + tot_female))
    let percent_female = 100 - percent_male

    // Show the statistics
    d3.select('.male_ratio').text(format_number(tot_male) + " (" + percent_male + "%)")
    d3.select('.female_ratio').text(format_number(tot_female) + " (" + percent_female + "%)")

    // Make animation
    let femaleSvg = d3.select('#svg_female svg #red_scale')
    let maleSvg = d3.select('#svg_female svg #red_scale')

    if (femaleSvg.empty()) {
        d3.xml("imgs/female.svg").mimeType("image/svg+xml").get((error, xml) => {
            d3.select('#svg_female').node().appendChild(xml.documentElement);
            animateGender('#svg_female', percent_female)
        });
        d3.xml("imgs/male.svg").mimeType("image/svg+xml").get((error, xml) => {
            d3.select('#svg_male').node().appendChild(xml.documentElement);
            animateGender('#svg_male', percent_male)
        });
        d3.select('#svg_female').on('click', selectGender('Miss'))
        d3.select('#svg_male').on('click', selectGender('Mister'))

    } else {
        animateGender('#svg_female', percent_female)
        animateGender('#svg_male', percent_male)
    }
}

function addData(chart, label, data) {
    if (label) {
        chart.data.labels.push(label);
    }
    chart.data.datasets.forEach((dataset) => {
        // console.log(dataset, 'A')

        dataset.data.push(data);
    });
    chart.update();
}

function fill_colors_bc(current_data) {

    let groupped_section = _.sortBy(_.filter(_.map(
        _.countBy(current_data, (x) => x['Type']),
        (v, k) => {
            return {
                'label': k,
                'data': [v]
            }
        }), (x) => ['Bachelor', 'Master', 'CMS', 'Exchange'].indexOf(x['label']) > -1), function(x) {
        return -x['data'][0];
    })
    // console.log(groupped_section)
    let dict = {}
    _.map(
        color_init,
        (v, k) => {
            if (groupped_section[k])
                dict[groupped_section[k]['label']] = v
            else
                null
        })
    colors_bc = dict


}

function addFilter(key, value) {
    filter[key] = value
    updateViz(null, (key != 'Year'))
}

function resetFilter() {
    filter = {
        'Year': filter['Year']
    }
    country = null
    map.setView([51.505, -0.09], 1.4)
    updateViz()
}

function show_tot_students(data) {
    d3.select('.total_student_count').text(format_number(data.length))
}

function show_viz_caption() {
    let caption = ''

    if (dict_inkeys(filter, 'Nationalité')) {
        caption += filter['Nationalité']
    }

    if (dict_inkeys(filter, 'Civilité')) {
        caption += ' '
        caption += (filter['Civilité'] == 'Mister') ? 'Male' : 'Female';
    }
    caption += (caption == '') ? 'Students' : ' students'

    caption += ' '
    if (dict_inkeys(filter, 'faculty')) {
        caption += 'majoring in ' +
            ((!dict_inkeys(filter, 'section')) ? filter['faculty'] : filter['section'])
    } else
        caption += 'at EPFL'


    d3.select('.viz_caption').text(caption)
}

function updateViz(data = null, update_timeseries = true) {
    if (original_data == null)
        original_data = data
    let current_data = original_data

    // Filter data by keys
    // TODO: Use _.where
    Object.keys(filter).forEach(
        (key_filter) => {
            if (key_filter != 'Type') {
                current_data = _.filter(current_data,
                    (student) => student[key_filter] == filter[key_filter]
                )
            }
        })
    fill_colors_bc(current_data)
    if (filter['Type'] && filter['Type'] != '') {
        current_data = _.filter(current_data,
            (student) => student['Type'] == filter['Type']
        )
    }

    if (update_timeseries) {
        // Transform data to timeseries format
        let timeseries_data = original_data;
        Object.keys(filter).forEach(
            (key_filter) => {
                if (key_filter != 'Year')
                    timeseries_data = _.filter(timeseries_data,
                        (student) => student[key_filter] == filter[key_filter]
                    )
            })
        show_timeseries_chart(timeseries_data)
    }
    // Show filtered visualisations
    show_gender_ratio(current_data)
    updateMap(current_data)
    show_type(current_data)
    show_sections(current_data)
    show_tot_students(current_data)
    show_viz_caption()
}



function selectGender(gender) {
    return () => {
        addFilter('Civilité', gender)
    }
}

function selectLevel(d, i) {
    // console.log(d)
    let section = d['id']
    addFilter('Type', section)
}

function show_years(years) {
    // Create a new slider for years
    var slider = Slider(".slider")
        .width(1212)
        .margin({
            left: 30,
            right: 30
        })
        .domain([2007, 2017])
        .snap(true)
        .on("change", (y) => addFilter('Year', String(y) + "-" + String(y + 1)))
        .handleRadius(10)
        .handleFill("#D80027")
        .channelFill("#e5e5e5")
        .axis(true)
        .tickSize(5)
        .tickFormat(d3.format('d'))
        .endLabelBelow(true)
        .startLabelBelow(true)
        .draw()
}


// Load ISA data from csv
d3.csv("./data/isa_data.csv", (data) => {
    show_years()
    data = _.map(data, help.add_faculty)
    updateViz(data)
    // console.log('HERE')
    let test = _.filter(data,
        (student) => student['faculty'] == "CDH")
    // console.log(test)

});

// Attach listeners
d3.select('#reset-filter').on('click', (e) => resetFilter())