import * as d3 from 'd3';
import * as _ from 'underscore';
import L from 'leaflet';
import * as c3 from 'c3';
import * as help from './helpers';
import * as chroma from 'chroma-js';
import Chart from 'chart.js'
import './plugin-chartjs';
import * as map_functions from './map-functions'
import { discover_function } from './discover-functions'
import { init_slider, show_year, update_year_text } from './slider_functions'
import {show_sections} from './sections_faculties_functions'


require("./main.css");


/********************************************Variables initialization***********************************************/
//Filters 

export let filter = {
    'Year': "2007-2008"
}

help.resize();

// stores the non-filtered data
let original_data = null

// Stacked bar chart variables
let myChart;
const color_init = { Bachelor: "#a50f15", Master: "#de2d26", Exchange: "#fb6a4a", CMS: "#fcae91" }
const hover_color_init = { Bachelor: 'rgba(165, 15, 21, 0.60)', Master: "rgba(222, 45, 38, 0.60)", Exchange: "rgba(251, 106, 74, 0.20)", CMS: "rgba(252, 174, 145, 0.60)" };

// Years chart variables
let timeseries_chart = null
let years_filter;

// Majors/faculty chart variables
let old_group_value, old_group_key;
let section_chart;

$(window).on('resize', function() {
    // resize the components when the window is resized
    help.resize();
    help.redimension(['#svg_female svg', '#svg_male svg'], [65.0 / 762, 65.0 / 762], 'height');
});

/*****************************************************Filters functions*******************************************/

export function setFilter(value) {
    // setter for filter variable

    filter = value;
}


export function addFilter(key, value) {
    // Function that add a new filter and update the whole visualisation
    filter[key] = value
    updateViz(null, (key != 'Year'))
}

export function resetFilter(updateViz_ = true) {
    // Function responsible for resetting the visualization when the 'reset' button is clicked

    filter = {
        'Year': filter['Year']
    }
    map_functions.country = null
    map_functions.map.setView([51.505, -0.09], 1.3)
    d3.select("#discover_text").html('&nbsp;');
    d3.selectAll('.popup').remove()

    if (updateViz_)
        updateViz()
}

/****************************************Faculties/Majors chart functions*******************************************/


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

/*********************************************Years chart functions************************************************/
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
            data: {
                x: 'Year',
                columns: timeseries,
                type: 'bar',
                onclick: function(e) {
                    let tmp = (String(e.x) + '-' + String(e.x + 1))
                    addFilter('Year', tmp)
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
                        format: help.format_number,
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


/*************************************************Stacked bar chart variables**************************************/
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
                plugins: {
                    stacked100: { enable: true }
                },
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
                    onClick: (e, item) => {
                        if (!item.hidden && item.text != filter['Type'])
                            addFilter('Type', item.text)
                        e.stopPropagation();
                    },
                    labels: {
                        usePointStyle: true

                    },
                    position: 'bottom'
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
                if (filter['Type'] == label)
                    addFilter('Type', null)
                else
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

function selectLevel(d, i) {
    // Function that filter the data by the selected type of students (Bachelor/Master/CMS/Exchange)
    let section = d['id']
    addFilter('Type', section)
}

/***********************************************genders SVGs functions*********************************************/

function animateGender(selector, percentage) {
    // Function that fills the SVG icons representing the genders
    let gradient_scale = d3.select(selector + ' svg #red_scale')
    gradient_scale.transition().duration(1000).attr('offset', 100 - (isNaN(percentage) ? 0 : percentage) + '%');
}

function show_gender_ratio(data) {
    // Group data by genders
    let groupped_gender = _.countBy(data, student => student['Civilité'])
    let tot_female = help.dict_inkeys(groupped_gender, 'Miss') ? groupped_gender['Miss'] : 0
    let tot_male = help.dict_inkeys(groupped_gender, 'Mister') ? groupped_gender['Mister'] : 0
    let percent_male = Math.round(tot_male * 100. / (tot_male + tot_female))
    let percent_female = 100 - percent_male

    // Show the statistics on genders
    d3.select('.male_ratio').text(help.format_number(tot_male) + " (" + (isNaN(percent_male) ? 0 : percent_male) + "%)")
    d3.select('.female_ratio').text(help.format_number(tot_female) + " (" + (isNaN(percent_female) ? 0 : percent_female) + "%)")

    // Make animation
    let femaleSvg = d3.select('#svg_female svg #red_scale')
    let maleSvg = d3.select('#svg_female svg #red_scale')

    if (femaleSvg.empty()) {
        // Load the svg images if it was not done before
        d3.xml("imgs/female.svg").mimeType("image/svg+xml").get((error, xml) => {
            d3.select('#svg_female').node().appendChild(xml.documentElement);
            animateGender('#svg_female', percent_female)
            help.redimension(['#svg_female svg'], [65.0 / 762], 'height');

        });
        d3.xml("imgs/male.svg").mimeType("image/svg+xml").get((error, xml) => {
            d3.select('#svg_male').node().appendChild(xml.documentElement);
            animateGender('#svg_male', percent_male)
            help.redimension(['#svg_male svg'], [65.0 / 762], 'height');
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



function selectGender(gender) {
    // Function which add the selected gender to the current filters
    return () => {
        if (filter['Civilité'] == gender)
            addFilter('Civilité', null)
        else
            addFilter('Civilité', gender)
    }
}


/**************************************Total number of students and caption functions******************************/
function show_tot_students(data) {
    // Function that updates the banner showing the total number of students selected by the current filters
    d3.select('.total_student_count').text(help.format_number(data.length))
}

function show_viz_caption() {
    /** Function that gives a summary of the selected filters, in other words , it describes the data that we are looking to **/
    let caption = ''
    if (help.dict_inkeys(filter, 'Nationalité') && filter['Nationalité']) {
        caption = filter['Nationalité']
    }

    if (help.dict_inkeys(filter, 'Type') && filter['Type']) {
        caption += ' '
        caption += filter['Type']
    }

    if (help.dict_inkeys(filter, 'Civilité') && filter['Civilité']) {
        caption += ' '
        caption += (filter['Civilité'] == 'Mister') ? 'Male' : 'Female';
    }
    caption += (caption == '') ? 'Students' : ' students'

    caption += ' '
    if (help.dict_inkeys(filter, 'faculty') && filter['faculty']) {
        caption += 'majoring in ' +
            ((!help.dict_inkeys(filter, 'section')) ? filter['faculty'] : filter['section'])
    } else
        caption += 'at EPFL'

    d3.select('.viz_caption').html(caption)
}

export function updateViz(data = null, update_timeseries = true) {
    // Function that updates all the visualization components after that a filter change was made
    // Store the data loaded from the CSV files if it is the first time we call the function
    if (original_data == null)
        original_data = data
    let current_data = original_data


    // Apply the current filters to our data, Except the 'Year' filter
    Object.keys(filter).forEach(
        (key_filter) => {
            if (key_filter != 'Year') {
                if (filter[key_filter] && filter[key_filter] != '') {
                    current_data = _.filter(current_data,
                        (student) => student[key_filter] == filter[key_filter]

                    )
                }
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
    map_functions.updateMap(current_data)
    show_type(current_data)
    show_year(filter['Year'])
    show_sections(current_data)
    show_tot_students(current_data)
    show_viz_caption()
}

/*********************************Loading data and associating listeners to buttons*********************************/

// Load ISA data from csv
d3.csv("./data/isa_data.csv", (data) => {
    data = _.map(data, help.add_faculty)
    updateViz(data)
    init_slider()

    //display the home page
    discover_function(false)
});


// Attach listeners
d3.select('#reset-filter').on('click', (e) => {
    resetFilter();
})
d3.select('#discover').on('click', (e) => discover_function())