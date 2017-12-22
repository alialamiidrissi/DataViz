/*

This files contains functions and variables for the horizontal bar chart rendering

*/

import Chart from 'chart.js';
import * as help from './helpers';
import { filter, addFilter, updateViz } from './main'
import * as _ from 'underscore';

// Majors/faculty chart variables
let old_group_value, old_group_key;
let section_chart;

function onclickSection(filter_param) {
    /** Function returning a function that is triggered when an click is detected on the majors bar chart **/

    return (evt) => {
        /** Function that filter the data by the selected faculty/major**/
        var activePoint = section_chart.getElementAtEvent(evt)[0];
        if (!activePoint) {
            // Unselect current filter
            let filter_;
            if (filter['section'] && filter['section'] != '')
                filter_ = 'section'
            else if (filter['faculty'] && filter['section'] != '')
                filter_ = 'faculty'
            if (filter_) {
                addFilter(filter_, null)
                updateViz()
            }

        } else {
            var label = activePoint._model.label
            if ((section_chart.data.datasets[activePoint._datasetIndex].data[activePoint._index]) > 0) {
                addFilter(filter_param, label)
            }
        }
    };
}

export function show_sections(data) {
    /** Funtion updating the majors/faculties bar chart **/

    //Selecting the div containing the chart
    let ctx = document.getElementById("section_chart")

    //check if the faculties or majors bar charts is displayed
    let group_key = 'faculty'
    if ('faculty' in filter &&
        filter['faculty'] != '' && filter['faculty']) {
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
                    xAxes: [{
                        ticks: {
                            min: 0,
                            beginAtZero: true,

                        },
                        afterBuildTicks: function(chart) {}
                    }],
                    yAxes: [{
                        gridLines: { display: false },
                        ticks: {
                            mirror: true,
                        }

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