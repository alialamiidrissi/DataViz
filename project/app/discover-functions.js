/**

File containing the discover feature functions and variables 

**/

import * as map_functions from './map-functions'
import { filter, resetFilter, updateViz, setFilter } from './main'
import * as d3 from 'd3'
import * as help from './helpers'



/******************************************** Variables Initialization ***********************************************/ 
let discover_index = 0;

// currently highlighted divs
let highlight = [];

// insights
const text_discover = [
    'The number of students enrolled in chemical engineering is constantly decreasing since 2013',
    'The number of students at the IC faculty is highly increasing since 2007. This field is mainly chosen by men',
    'The number of Swiss students has been stagnating since 2013',
    'Students from French speaking countries are more attracted by bachelor programs. Meanwhile, students from other countries follow an inverse trend',
    "On average, the female to male ratio slowly increases over the 10 last years. However, the latter significantly improved for some major as Microengineering",
    "From 2007 to 2017, the faculty with the highest female to male ratio has always been SV",
    "The total number of students is constantly growing since 2007",
    "Welcome to our visualisation, an attempt to get more insights about EPFL students in a fun way.Proudly made by EPFL students."
]

// Maps component names to their divs
let dict_key_div = {
    'faculty': '.section_chart',
    'Year': '.timeseries_chart',
    'citizenship': '#map',
    'Type': "#level_chart",
    'gender': '.gender_ratio',
    'total_student': '.total_student_count',
    'caption': '.viz_caption',
    'slider': '#slidecontainer',
    'title': '.title',
    'button': '.tool-but'
}

// components to highlight for 
const highlights_discover = [
    ['Year'],
    ['Year', 'gender'],
    ['Year'],
    ['citizenship', 'Type'],
    ['gender', 'slider', 'faculty'],
    ['gender', 'slider'],
    ['Year']
]

// Determines which text to display in the popups near the highlighted components
const description_popups = [
    [false],
    [false, false],
    [false],
    [true, true],
    [true, true, true],
    [false, true],
    [false]
]


// Filters for each insight 
const filters_discover = [{
        Year: '2017-2018',
        faculty: 'SB',
        section: 'Chemistry and Chemical Engineering'
    },
    {
        Year: '2017-2018',
        faculty: 'IC'
    },
    {
        'Year': '2017-2018',
        'Nationalité': 'Swiss'
    },
    {
        Year: '2017-2018',
        'Nationalité': 'French'
    },
    {
        'Year': '2007-2008'
    },
    {
        'Year': '2007-2008',
        faculty: 'SV'
    }, {
        'Year': '2017-2018'
    }
]

/*************************************************Functions*********************************************************/

function update_discover(highlight_, text, filters) {
    // Function triggered when the discover button is clicked. apply the 'filters' passed in parameter,
    // stores the divs 'highlight_'to be highlithed in 'highlight' and display the text in 'text' inside in the discover-text div
    if (highlight_) {
        highlight = highlight_;
    }

    // update filters
    setFilter(filters)
    // Zoom on selected country
    if (help.dict_inkeys(filters, 'Nationalité')) {
        map_functions.map.eachLayer(function(layer) {
            if (layer.feature && layer.feature.properties.sovereignt == map_functions.country) {
                map_functions.map.fitBounds(layer.getBounds());
            }
        })
    }

    // update the slider 

    if (text) {
        // display the insight

        d3.select("#discover_text").style('opacity', "0")
            .html('<b>' + text + "</b>").classed("shadow_apply", true)
            .transition().duration(1000).style('opacity', "1")

    }

    // update the map and the charts
    updateViz()
}


export function discover_function(show_insight = true) {
    // Function triggered when the discover button is clicked

    let index = text_discover.length - 1;


    // stores the last blurred component
    let selection;

    // reset the visualization if this is not the loading page

    if (show_insight) {
        resetFilter(false)
        //select an insight and increment its index so we won't have the same one when we click on discover next time
        index = discover_index
        discover_index = (discover_index + 1) % (filters_discover.length)
    }


    // subfunction that adds popups near the components that we want to highlight 
    let add_popups = () => {

        highlight.forEach(function(element, sub_index) {

            // get dimensions of one of the highlithed divs
            let node_element = d3.select(dict_key_div[element]).node().getBoundingClientRect()
            let x = 0
            let y = 0

            // Define the text inside the popup.
            // This text values depends on wheter we want our user to interact with the highlighted component or not
            let text = description_popups[index][sub_index] ? 'Play with this component for further insights!' : 'See insights here'

            // Compute the coordinates of the popups depending the highlighted div
            let popup_node = d3.select('body').append('div')
                .classed('popup', true)
                .style('opacity', '0')
                .text(text)


            let pop_w = popup_node.node().getBoundingClientRect().width

            if (element == 'Year') {
                // popup position if the highlighted div is the timechart
                x += node_element.x + node_element.width / 2 - pop_w / 2
                y += node_element.y
            } else if (element == 'gender' || element == 'Type') {
                // popup position if the highlighted div is the one related to the gender or the which represent the distribution
                // of Bachelor/master/CMS/exchange students
                popup_node.style('max-width', d3.select('.table-container').node().getBoundingClientRect().x - 10 + 'px')
                pop_w = popup_node.node().getBoundingClientRect().width
                x += node_element.x - pop_w
                y += node_element.y + ((element == 'gender') ? node_element.height / 2 : 0)
            } else if (element == 'slider') {
                // popup position highlighted component is the slider
                node_element = d3.select('#forward-button').node().getBoundingClientRect()
                x += node_element.x + node_element.width + 20
                y += node_element.y - node_element.height / 2
                text = '< ' + text
            } else {
                pop_w = popup_node.node().getBoundingClientRect().width
                x += node_element.x + pop_w
                y += node_element.y + node_element.height / 2
            }

            // hide the popups after 8s or when the user click on them  
            popup_node.style('top', y + 'px')
                .style('left', x + 'px')
                .style('opacity', '0.0')
                .on('click', function(e) { d3.select(this).remove() })
                .transition().duration(1000)
                .style('opacity', '1')
                .transition().delay(8000)
                .transition().duration(1000).style('opacity', 0)
                .each('end', function(e) { d3.select(this).remove() })
        });
    }



    // Blurs all visualization components
    Object.keys(dict_key_div).forEach((v) => {
        selection = d3.selectAll(dict_key_div[v])
            .style('filter', 'blur(10px)')
            .transition()
            .duration(1000)
            .style('opacity', '0.45')
            .style('pointer-events', 'none')
    })

    // get the dimension of the HTML table containing our visualization components 

    let table_contained_node = d3.select('.table-container').node().getBoundingClientRect()
    let x = table_contained_node.x + table_contained_node.width / 2
    let y = table_contained_node.y + table_contained_node.height / 2

    // create the popup containing the insight and center it on the screen
    let popup_div = d3.select('body').append('div')
        .classed('popup', true).style('top', y + 'px').style('color', '#000')
        .style('background', 'transparent')
        .style('font-size', '20pt')
        .style('width', '100%')
        .style('text-align', 'center')
        .style('margin-top', '-100px')
        .style('padding', '0px')


    // Add the insight text and a comment
    let text_spaced = text_discover[index].split(".");
    // if (show_insight)
    text_spaced = text_spaced.join("<br>")
    // else
    //     text_spaced = text_spaced[0] + text_spaced.slice(1).join("<br>")
    popup_div.append('div').html(text_spaced).classed('discover-text', 'true')

    popup_div.append('div')
        .text(show_insight ? 'Click anywhere to explore these insights!' : 'Click anywhere to start exploring!')
    popup_div.append('div').transition().duration(1000).style('opacity', 1)


    // Step triggered when the blurring transition ends for all components
    selection.each('end', () => {
        // Define an OnClick event on our HTML so that the user can disable the blur when he clicks on the screen
        d3.select('body').on('click', function(e) {
            Object.keys(dict_key_div).forEach((v) => {
                d3.selectAll('.popup').remove()
                d3.selectAll(dict_key_div[v])
                    .style('filter', 'none')
                    .style('opacity', '1')
                    .style('pointer-events', 'auto')
                if (show_insight)
                    update_discover(highlights_discover[index], text_discover[index], filters_discover[index])
                // reset the onClick function for the HTML body
                d3.select(this).on('click', () => false)
            })

            if (show_insight)
                add_popups();
        })
    })
}