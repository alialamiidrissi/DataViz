import * as d3 from 'd3-3';
import * as _ from 'underscore';
import L from 'leaflet';
import * as c3 from 'c3';
import * as help from './helpers';
import * as chroma from 'chroma-js';
import Chart from 'chart.js'
import 'bootstrap';
import './plugin-chartjs';



require("./main.css");


const divs = ['#svg_male', '#svg_female', '.section_chart', '.timeseries_chart', '#level_chart', '#map', '.slider','#back-button svg','#forward-button svg'];
const ratios = [65.0 / 762, 65.0 / 762, 220.0 / 762, 230.0 / 762, 65.0 / 762, 290.0 / 762, 5.0 / 762,20.0/762,20.0/762];
let discover_clicked = false;

Chart.defaults.global.customTooltips = (tooltips) => console.log(tooltips)


function resize() {
    help.redimension(divs, ratios, 'max-height');
    const tmp_divs = ['.section_chart', '.table-container', '.timeseries_chart', '.table-container td #map', '#map','#back-button svg','#forward-button svg']
    const tmp_ratios = [(300.0 / 1286), (1100.0 / 1286), 670.0 / 1286, 600.0 / 1286, 600.0 / 1286,20.0/1286,20.0/1286]
    help.redimension(tmp_divs, tmp_ratios, 'width', 'px', 'w')
    help.redimension(tmp_divs, tmp_ratios, 'max-width', 'px', 'w')
    help.redimension(['.viz_caption', '#discover_text'], [20.0 / 1286, 20.0 / 1286], 'padding-left', 'px', 'w')
    help.redimension(['.title'], [5.0 / 762], 'padding-bottom')
    help.redimension(['.title', '#discover_text', '.female_ratio', '.male_ratio'], [5.0 / 762, 10.0 / 762, 5.0 / 762, 5.0 / 762], 'padding-top')
    //help.redimension(['.male_ratio', '.female_ratio'], [10.0 / 762, 10.0 / 762], 'max-height')

    help.redimension(['.title', '.title_2','#year-display'], [18 / 762.0, 18 / 762.0,18 / 762.0], 'font-size', 'px')
}

resize();

$(window).on('resize', function() {
    resize();
    help.redimension(['#svg_female svg', '#svg_male svg'], [65.0 / 762, 65.0 / 762], 'height');
    //help.redimension(['#svg_female svg', '#svg_male svg'], [100.0 / 1286, 100.0 / 1286], 'width', 'px', 'w');



});


let highlight = [];
let years_filter;
const text_discover = ['Studying chemistry is not popular anymore.In fact, the number of students enrolled in chemical engineering is decreasing constantly since 2013',
    '...The number of students at the IC faculty is booming since 2007.However,this field is mainly dominated by men',
    'The number of Swiss students at EPFL has been stagnating since 2013',
    'Students from French speaking countries are more attracted by EPFL bachelor programs. Meanwhile, students from other countries follow an inverse trend',
    "Ratio Women/Man at EPFL didn't increase that much over the 10 last years on average. However, the latter significantly improved for some major as Microengineering"
]



const filters_discover = [
    [{
        Year: '2017-2018',
        faculty: 'SB',
        section: 'Chemistry and Chemical Engineering'
    }],
    [{
        Year: '2017-2018',
        faculty: 'IC'
    }],
    [{
        'Year': '2017-2018',
        'Nationalité': 'Swiss'
    }],
    [{
        Year: '2017-2018',
        'Nationalité': 'French'
    }, {
        Year: '2017-2018',
        'Nationalité': 'Belgian'
    }, {
        Year: '2017-2018',
        'Nationalité': 'Moroccan'
    }, {
        Year: '2017-2018',
        'Nationalité': 'Italian'
    }, {
        Year: '2017-2018',
        'Nationalité': 'Chinese'
    }],
    [{
            'Year': '2007-2008'
        },
        {
            'Year': '2012-2013'
        },
        {
            'Year': '2017-2018'
        }, {
            'Year': '2007-2008',
            'section': 'Microengineering',
            faculty: 'STI'
        },
        {
            'Year': '2012-2013',
            'section': 'Microengineering',
            faculty: 'STI'
        },
        {
            'Year': '2017-2018',
            'section': 'Microengineering',
            faculty: 'STI'
        }
    ]
]
const delays = {
    3: 3000,
    4: 3000
}
const highlights_discover = [
    ['Year'],
    ['Year', 'gender'],
    ['Year', 'citizenship'],
    ['citizenship', 'Type', 'caption'],
    ['gender', 'caption']
]
let timeouts = []


// json object mapping countries to citizenships

let g_json;

// Variables used to build the stacked bar chart for displaying the types
let myChart;
const color_init = { Bachelor: "#a50f15", Master: "#de2d26", Exchange: "#fb6a4a", CMS: "#fcae91" }
const hover_color_init = { Bachelor: 'rgba(165, 15, 21, 0.60)', Master: "rgba(222, 45, 38, 0.60)", Exchange: "rgba(251, 106, 74, 0.20)", CMS: "rgba(252, 174, 145, 0.60)" }


// used use for the discover function
let dict_key_div = {
    'faculty': ['.section_chart', show_sections],
    'Year': ['.timeseries_chart', show_timeseries_chart],
    'citizenship': ['#map', updateMap],
    'Type': ["#level_chart", show_type],
    'gender': ['.gender_ratio', show_gender_ratio],
    'total_student': ['.total_student_count', show_tot_students],
    'caption': ['.viz_caption', show_viz_caption]

}

//Map variable
let chroma_colors = chroma.scale('OrRd').classes(5);
let groupped_nationalities;
let country;
let colors = ['#fad9d3', '#f0baaf', '#e39a8d', '#d57c6c', '#c55b4c', '#b3392d', '#a00310']
let map = L.map('map').setView([51.505, -0.09], 1.4);
let info = L.control();
map.options.minZoom = 1;
let scale;
//let get_color = x => d3.scale.threshold().range(['#fee5d9', '#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15']).domain(scale)(x);
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

        for (var i = 0; i < scale.length - 1; i++) {
            this._div.innerHTML +=
                '<i style="background:' + color(scale[i]) + '"></i> ' +
                (round5(scale[i])) + ((round5(scale[i + 1])) ? '&ndash;' + (round5(scale[i + 1])) + '<br>' : '+');
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

// Function used to display the number of student coming from a certain country
info.update = function(props) {
    this._div.innerHTML = '<h4> Country</h4>'
    this._div.innerHTML += (props ? '<b>' + props[0] + '</b><br />' + (props[1] ? props[1] : 0) + ' student' :
        'Hover over a country')
};

info.addTo(map);



let timeseries_chart = null
let original_data = null

//Filters storing variable
let filter = {
    'Year': "2007-2008"
}

// variables used to update the majors chart
let old_group_value, old_group_key;
let section_chart;


let numberSort = function(a, b) {
    // ordering function
    return a - b;
};

function round5(x) {
    // rounding function
    return Math.ceil(x);
}

function updateMap(data) {
    /***Function used to update the  map***/


    // group data by citizenship and update information panel
    groupped_nationalities = _.countBy(data, (x) => x['Nationalité']);
    if ('Nationalité' in filter &&
        filter['Nationalité'] != '') {
        let arr = [country, groupped_nationalities[filter['Nationalité']]]
        info.update(arr);
    } else {
        // change the map scale if no country is selected
        let values = _.map(groupped_nationalities, (v, k) => parseFloat(v)).sort(numberSort)
        scale = chroma.limits(values, 'l', 5);
        // scale = scale.map(x => x+1);


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
            fillColor: (((country == feature.properties.sovereignt) || !country) && nb_value > 0) ? scale(nb_value) : '#d9d9d9',
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
        nb_value = (data[help.codes_mapping[feature.properties['wb_a2']]])
    else
        nb_value = (data[help.codes_mapping[feature.properties['postal']]])
    return nb_value
}

function fetch_nationality(feature) {
    // fetch nationality
    let nationality = ''
    if (feature.properties['wb_a2'] != -99)
        nationality = (help.codes_mapping[feature.properties['wb_a2']])
    else
        nationality = (help.codes_mapping[feature.properties['postal']])
    return nationality
}

function highlightFeature() {
    // highlight country when hovering over it
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
    if ('Nationalité' in filter &&
        filter['Nationalité'] != '')
        return
    country = e.target.feature.properties.sovereignt
    map.fitBounds(e.target.getBounds());
    let nationality = fetch_nationality(e.target.feature);
    addFilter('Nationalité', nationality)
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
            filter['Nationalité'] != '')
            return
        info.update();


    }

}


function selectFaculty(d, i) {
    /*** Function used to update the faculty filter ***/
    let key = 'faculty'
    if (dict_inkeys(filter, 'faculty') && filter['faculty'] != '')
        key = 'section'
    addFilter(key, d['id'])
}

function onclickSection(filter) {
    /** Function returning a function that is triggered when an click is detected on the majors bar chart **/
    return (evt) => {
        /** Function that filter the data by the selected faculty/major**/
        var activePoint = section_chart.getElementAtEvent(evt)[0];
        if (!activePoint) return
        var label = activePoint._model.label
        if ((section_chart.data.datasets[activePoint._datasetIndex].data[activePoint._index]) > 0) {
            addFilter(filter, label)
        }
    };
}

function show_sections(data) {
    /** Funtion updating the majors/faculties bar chart **/

    //Selecting the div containing the chart
    let ctx = document.getElementById("section_chart")

    //check if the faculties or majors bar charts is displayed
    let group_key = 'faculty'
    if ('faculty' in filter &&
        filter['faculty'] != '') {
        group_key = 'section'
    }

    // aggregate data by major/faculty
    let count_sections = _.countBy(data, x => x[group_key]);

    // Initialize the chart's data
    let to_display = {
        labels: [],
        datasets: [{
            label: 'Number of students',
            data: [],
            backgroundColor: [],
            hoverBackgroundColor: []
        }]
    }

    _.sortBy(_.map(count_sections,
        (v, k) => [k, v]), l => -l[1]).forEach(l => {
        to_display.datasets[0].data.push(l[1])
        to_display.labels.push(l[0])
        to_display.datasets[0].backgroundColor.push('rgba(216, 0, 39, 0.2)')
        to_display.datasets[0].hoverBackgroundColor.push('rgba(216, 0, 39, 0.5)')
    })

    // Check if the chart was already created
    if (section_chart) {
        // Check if the section or faculty filter was changed
        if ((old_group_value == filter[group_key]) && (old_group_key == group_key)) {

            //update bar chart values
            for (let i = 0; i < section_chart.data.labels.length; i++) {
                // replace bar chart values by the new ones or by 0 if the faculty/major has no enrolled student for the current selection
                // e.g : This is the case for Data Science before 2017 since the major was not present 
                if (section_chart.data.labels[i] in count_sections) {
                    let tmp = count_sections[section_chart.data.labels[i]]
                    count_sections[section_chart.data.labels[i]] = -1
                    section_chart.data.datasets[0].data[i] = tmp


                } else {
                    section_chart.data.datasets[0].data[i] = 0

                }


            }

            // Check if a major/faculty was added 
            // e.g : Between 2016 and 2017, a bar is added for the Data Science section
            for (let key in count_sections) {
                if (count_sections[key] != -1) {
                    addData(section_chart, key, count_sections[key])
                    section_chart.data.datasets[0].backgroundColor.push('rgba(216, 0, 39, 0.2)')
                }
            }

        } else {
            // change the whole data if the section or faculty filter was changed.
            section_chart.data.labels = to_display.labels
            section_chart.data.datasets = to_display.datasets
            ctx.onclick = onclickSection(group_key)
        }

        // update chart
        section_chart.update(1000)


    } else {



        // Initialize bar chart if it was not created before
        section_chart = new Chart(ctx, {
            type: 'horizontalBar',
            data: to_display,
            options: {
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                    // xAxes: [{ gridLines: { display: false }}],
                    yAxes: [{
                        ticks: { mirror: true },
                        gridLines: { display: false }
                    }]
                },
                legend: {
                    display: false
                },
                tooltips: {
                    callbacks: {

                    }
                }
            }
        });

    }
    ctx.onclick = onclickSection(group_key)

    old_group_value = filter[group_key];
    old_group_key = group_key;
}



function addData(chart, label, data) {

    // Function used to add data to chartjs bar chart
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
}

function format_number(n) {

    // formatting function that keeps only 2 digits
    if (n < 1000)
        return Math.round(n)
    else
        return (parseFloat(n) / 1000).toFixed(1) + 'K'
}

function dict_inkeys(dict, str) {
    // Function that check if a JSON object "dict" contains a key "str"
    return (str in dict);
}



function show_timeseries_chart(data) {

    // Function that creates and  updates the bar chart displaying the number of students per year

    //  array holding the bar chart values 
    let timeseries = [
        ['Year'],
        ['Number of Students']
    ]

    // group the data per year and aggregate by count 
    let count_per_year = _.countBy(data, x => x['Year'])
    years_filter = count_per_year;

    // fill the array holding the bar chart values
    help.all_years.forEach((k) => {
        let tmp = years_filter[String(k) + '-' + String(k + 1)];
        timeseries[0].push(k);
        timeseries[1].push(tmp ? tmp : 0)
    })



    // update the bar if it is already created of initialize a new one
    if (timeseries_chart != null) {
        timeseries_chart.load({
            columns: timeseries
        })
    } else {

        // Initialise the timeseries chart
        timeseries_chart = c3.generate({
            bindto: '.timeseries_chart',
            // size: {
            //     height: 350
            // },
            data: {
                x: 'Year',
                columns: timeseries,
                type: 'bar',
                onclick: function(e) {
                    let tmp = (String(e.x) + '-' + String(e.x + 1))
                    addFilter('Year', tmp)
                    show_year(tmp)
                }
            },
            axis: {
                x: {
                    show: true,
                    max: 2017,
                    min: 2007


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
            },
            color: {
                pattern: ['#D80027']
            }
        });

    }
}


function blink_div(div, delay, times = 1) {
    let select = d3.selectAll(div)
    let transition = select.transition()
        .duration(parseInt(delay / 2))
        .style("opacity", "0")
        .transition()
        .duration(parseInt(delay / 2))
        .style("opacity", "1")
    if (times > 1) {
        transition.each('end', () => blink_div(div, delay, times - 1));
    }
}

function roundnum50(num) {
    return Math.floor(num / 50) * 50;
}

function show_type(data) {
    // Function that creates and update the stacked bar representing the type attribute

    // group by type and aggregate by count 
    let count_types = _.countBy(data, (x) => x['Type'])

    // create the object that will hold the bar chart values and will be passed to chartjs constructor
    let groupped_section = _.sortBy(_.filter(_.map(
        count_types,
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
            x['backgroundColor'] = color_init[x['label']];
            x['hoverBackgroundColor'] = hover_color_init[x['label']];
            return x
        })

    // Create a new bar chart for types if it was not dones before 
    if (!myChart) {

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
                        stacked: true,
                        display: false
                    }],
                    xAxes: [{
                        stacked: true,
                        display: false
                    }]
                },
                hover: {
                    mode: 'nearest'
                },
                legend: {
                    onClick: (e) => e.stopPropagation(),
                    labels: {
                        usePointStyle: true
                    }
                }
            }

        }

        // Select the canevas where the chart will be plotted
        var canvas = document.getElementById("level_chart")
        myChart = new Chart(canvas, chartData);


        // define the function that will be triggered when we select a chunk of the stacked bar chart 
        canvas.onclick = function(evt) {
            var activePoint = myChart.getElementAtEvent(evt)[0];
            if (activePoint) {
                var data = activePoint._chart.config.data;
                var datasetIndex = activePoint._datasetIndex;
                var label = data.datasets[datasetIndex].label;
                addFilter('Type', label)
            }
        };

    } else {

        // update data if the chart was already created
        for (let i = 0; i < myChart.data.datasets.length; i++) {

            let tmp = count_types[myChart.data.datasets[i].label]
            if (tmp) {
                myChart.data.datasets[i].data[0] = tmp
                myChart.data.datasets[i].hidden = false
            } else {
                myChart.data.datasets[i].data[0] = 0
                myChart.data.datasets[i].hidden = true

            }


        }

                // Update chart
        myChart.update(1000)
    }
}

function animateGender(selector, percentage) {
    // Function that fills the SVG icons representing the genders
    let gradient_scale = d3.select(selector + ' svg #red_scale')
    gradient_scale.transition().duration(1000).attr('offset', 100 - (isNaN(percentage) ? 0 : percentage) + '%');
}

function show_gender_ratio(data) {

    // Group data by genders
    let groupped_gender = _.countBy(data, student => student['Civilité'])
    let tot_female = dict_inkeys(groupped_gender, 'Miss') ? groupped_gender['Miss'] : 0
    let tot_male = dict_inkeys(groupped_gender, 'Mister') ? groupped_gender['Mister'] : 0
    let percent_male = Math.round(tot_male * 100. / (tot_male + tot_female))
    let percent_female = 100 - percent_male


    // Show the statistics on genders
    d3.select('.male_ratio').text(format_number(tot_male) + " (" + (isNaN(percent_male) ? 0 : percent_male) + "%)")
    d3.select('.female_ratio').text(format_number(tot_female) + " (" + (isNaN(percent_female) ? 0 : percent_female) + "%)")

    // Make animation
    let femaleSvg = d3.select('#svg_female svg #red_scale')
    let maleSvg = d3.select('#svg_female svg #red_scale')

    if (femaleSvg.empty()) {
        // Load the svg images if it was not done before
        d3.xml("imgs/female.svg").mimeType("image/svg+xml").get((error, xml) => {
            d3.select('#svg_female').node().appendChild(xml.documentElement);
            animateGender('#svg_female', percent_female)
            help.redimension(['#svg_female svg'], [65.0 / 762], 'height');
            //help.redimension(['#svg_female svg'], [100.0 / 1286], 'width', 'px', 'w');




        });
        d3.xml("imgs/male.svg").mimeType("image/svg+xml").get((error, xml) => {
            d3.select('#svg_male').node().appendChild(xml.documentElement);
            animateGender('#svg_male', percent_male)
            help.redimension(['#svg_male svg'], [65.0 / 762], 'height');
            // help.redimension(['#svg_male svg'], [100.0 / 1286], 'width', 'px', 'w');




        });

        // Set the behavior when  the images are clicked 
        d3.select('#svg_female').on('click', selectGender('Miss'))
        d3.select('#svg_male').on('click', selectGender('Mister'))

    } else {
        // Update the SVG image filling ratio if they were already loaded
        animateGender('#svg_female', percent_female)
        animateGender('#svg_male', percent_male)
    }
}

function addData(chart, label, data) {

    // Function that add a new data point to a charjs plot
    if (label) {
        chart.data.labels.push(label);
    }
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}



function addFilter(key, value) {
    // Function that add a new filter and update the whole visualisation
    filter[key] = value
    updateViz(null, (key != 'Year'))
}

function resetFilter(updateViz_ = true) {

    // Function responsible for resetting the visualization when the 'reset' button is clicked

    filter = {
        'Year': filter['Year']
    }
    country = null
    map.setView([51.505, -0.09], 1.3)
    reset_shadow();
    d3.select("#discover_text").classed("shadow_apply", false).html('');
    timeouts.forEach((element, index) => clearTimeout(element));
    timeouts = [];
    if (updateViz_) {
        updateViz()
        $("#discover_text").hide();
        d3.selectAll(".title").transition()
            .duration(500).style('display', 'inline');
        d3.selectAll(".title_2").transition()
            .duration(500).style('display', 'inline');
    }
}

function show_tot_students(data) {
    // Function that updates the banner showing the total number of students selected by the current filters
    d3.select('.total_student_count').text(format_number(data.length))
}

function show_viz_caption() {

    /** Function that gives a summary of the selected filters, in other words , it describes the data that we are looking to **/
    let caption = ''
    if (dict_inkeys(filter, 'Nationalité')) {
        caption = filter['Nationalité']
    }

    if (dict_inkeys(filter, 'Type')) {
        caption += ' '
        caption += filter['Type']
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

    caption += ' in ' + filter['Year']

    d3.select('.viz_caption').html(caption)
}

function updateViz(data = null, update_timeseries = true) {
    // Function that updates all the visualization components after that a filter change was made
    // Store the data loaded from the CSV files if it is the first time we call the function
    if (original_data == null)
        original_data = data
    let current_data = original_data


    // Apply the current filters to our data, Except the 'Year' filter
    Object.keys(filter).forEach(
        (key_filter) => {
            if (key_filter != 'Year') {
                current_data = _.filter(current_data,
                    (student) => student[key_filter] == filter[key_filter]
                )
            }
        })

    let timeseries_data = current_data

    // update the number of students per year chart if update_timeseries is True
    if (update_timeseries) {
        show_timeseries_chart(current_data)


    }


    // Apply the filter on the 'Year attribute'
    if (filter['Year'] && filter['Year'] != '')
        current_data = _.filter(current_data,
            (student) => student['Year'] == filter['Year'])

    // Show filtered visualisations
    show_gender_ratio(current_data)
    updateMap(current_data)
    show_type(current_data)
    show_sections(current_data)
    show_tot_students(current_data)
    show_viz_caption()
}



function selectGender(gender) {
    // Function which add the selected gender to the current filters
    return () => {
        addFilter('Civilité', gender)
    }
}

function selectLevel(d, i) {
    // Function that filter the data by the selected type of students (Bachelor/Master/CMS/Exchange)
    let section = d['id']
    addFilter('Type', section)
}

function show_year(text) {
    // Create a new slider for years
    // let slider = document.getElementById("myRange");

    // slider.value = year;
    let div = d3.select('#year-display');
    div.style('opacity', '0')
    div.text(text)
    div.transition().duration(500).style('opacity', '1')



}

function init_slider() {

    //Function that initialize the years slider

    // let slider = document.getElementById("myRange");

    // slider.oninput = function() {
    //     let filter_ = String(this.value) + '-' + String(parseInt(this.value) + 1);
    //     if (dict_inkeys(years_filter, filter_) && years_filter[filter_] != 0) {
    //         addFilter('Year', filter_);
    //         updateViz();
    //     }
    // }

    d3.xml("imgs/back.svg").mimeType("image/svg+xml").get((error, xml) => {
        let div = d3.select('#back-button')
        div.node().appendChild(xml.documentElement);
        show_year(filter['Year'])
        div.on('click', () => {
            show_year(update_year_text(filter['Year'], -1));

        })
    });
    d3.xml("imgs/forward.svg").mimeType("image/svg+xml").get((error, xml) => {
        let div = d3.select('#forward-button')
        div.node().appendChild(xml.documentElement);
        div.on('click', () => show_year(update_year_text(filter['Year'], 1)))

    });
}

function update_year_text(text, inc) {
    let string_years = text.split('-')
    let tmp = text


    if (((parseInt(string_years[0]) < 2017) && (inc == 1)) || ((parseInt(string_years[0]) > 2007) && inc == -1)) {

        tmp = String(parseInt(string_years[0]) + inc) + '-' + String(parseInt(string_years[1]) + inc)
        addFilter('Year', tmp);
        show_year(tmp);
    }
    return tmp;

}

function update_discover(highlight_, text, filters) {

    // remove old shadows
    if (text) {
        resetFilter(false)
    }
    // shadow the compnents given in parameter

    if (highlight_) {
        highlight = highlight_;
        // Object.keys(dict_key_div).forEach(function(element, index) {
        //     if (highlight.includes(element))
        //         d3.selectAll(dict_key_div[element][0]).classed("shadow_apply", true);
        //     else
        //         d3.selectAll(dict_key_div[element][0]).classed("opacity-change", true);

        // });

        highlight.forEach(function(element) {
            blink_div(dict_key_div[element][0], 1500, 3)
        });
    }

    // update filters
    filter = filters
    // Zoom on selected country
    if (dict_inkeys(filters, 'Nationalité')) {
        country = help.citizenships_countries[filters['Nationalité']]
        console.log(country)
        map.eachLayer(function(layer) {
            if (layer.feature && layer.feature.properties.sovereignt == country) {
                map.fitBounds(layer.getBounds());

            }
        })
    }
    show_year(filters['Year'].split('-')[0])

    if (text) {

        d3.select("#discover_text").html('<b>' + text + "</b>").classed("shadow_apply", true)
        $("#discover_text").show(1000)

        //TODO
        d3.selectAll(".title").transition()
            .duration(1000).style('display', 'none');
        d3.selectAll(".title_2").transition()
            .duration(1000).style('display', 'none');

    }


    updateViz()




}

function reset_shadow() {
    Object.keys(dict_key_div).forEach(function(element, index) {
        d3.selectAll(dict_key_div[element][0]).classed("shadow_apply", false);
        d3.selectAll(dict_key_div[element][0]).classed("opacity-change", false);

    });


}

function logging() {
    console.log('clicked')
}

function discover_function() {
    let index = help.getRandomInt(0, text_discover.length - 1);
    if (filters_discover[index].length > 1) {
        // discover_with_delay(0, index)
        // help.popup_show('Explore the hovering components to verify the displayed statement', () => update_discover(highlights_discover[index], text_discover[index], filters_discover[index][0]))
        update_discover(highlights_discover[index], text_discover[index], filters_discover[index][0])
    } else
        update_discover(highlights_discover[index], text_discover[index], filters_discover[index][0])


}

function discover_with_delay(sub_index, index) {
    let highlight_temp = null
    let text_temp = null
    let filter_temp = filters_discover[index][sub_index]

    if (sub_index == 0) {
        highlight_temp = highlights_discover[index]
        text_temp = text_discover[index]
    }
    update_discover(highlight_temp, text_temp, filter_temp)
    if (sub_index < (filters_discover[index].length - 1)) {
        timeouts.push(setTimeout(() => discover_with_delay(sub_index + 1, index), delays[index]))
    }

}




// Load ISA data from csv
d3.csv("./data/isa_data.csv", (data) => {
    data = _.map(data, help.add_faculty)
    $("#discover_text").hide()
    updateViz(data)
    init_slider()


});


// Attach listeners
d3.select('#reset-filter').on('click', (e) => {
    resetFilter();
})

d3.select('#discover').on('click', (e) => discover_function())