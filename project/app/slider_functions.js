/*
This file contain the slider functions 
*/

import * as d3 from 'd3';
import { filter, addFilter } from './main'


export function show_year(text) {
    // display the current academic year in the slider and disable the back and forward slider arrows if needed

    let string_years = text.split('-')
    let div = d3.select('#year-display');
    div.style('opacity', '0')
    div.text(text)
    div.transition().duration(500).style('opacity', '1')

    // enable/disable arrows
    let show_arrows = (opacities, pointer_events) => {
        d3.select('#back-button').style('opacity', opacities[0]).style('pointer-events', pointer_events[0])
        d3.select('#forward-button').style('opacity', opacities[1]).style('pointer-events', pointer_events[1])
    }

    // enable an arrow only if we can increment the years in its direction
    if ((parseInt(string_years[0]) < 2017) && (parseInt(string_years[0]) > 2007)) {
        //enable back and forward arrow
        show_arrows([1, 1], ['auto', 'auto'])
    } else if (parseInt(string_years[0]) == 2017) {
        //disable only forward arrow
        show_arrows([1, 0], ['auto', 'none'])
    } else {
        //disable only back arrow
        show_arrows([0, 1], ['none', 'auto'])
    }
}


export function init_slider() {
    // Function that initialize the years slider

    d3.xml("imgs/back.svg").mimeType("image/svg+xml").get((error, xml) => {
        let div = d3.select('#back-button')
        div.node().appendChild(xml.documentElement);
        div.on('click', () => {
            update_year_text(filter['Year'], -1);
        })
    });
    d3.xml("imgs/forward.svg").mimeType("image/svg+xml").get((error, xml) => {
        let div = d3.select('#forward-button')
        div.node().appendChild(xml.documentElement);
        div.on('click', () => update_year_text(filter['Year'], 1))
    });
}

function update_year_text(text, inc) {
    // function called when the years slider arrows are clicked. increment the current academic year if inc == 1
    // and decrement the current academic year if inc == -1
    // This function checks also if the year values still between '2007-2008' and '2017-2018'

    let string_years = text.split('-')
    let tmp = text
    if (((parseInt(string_years[0]) < 2017) && (inc == 1)) || ((parseInt(string_years[0]) > 2007) && inc == -1)) {
        tmp = String(parseInt(string_years[0]) + inc) + '-' + String(parseInt(string_years[1]) + inc)
        addFilter('Year', tmp);
    }

    return tmp;
}