# leaflet-double-scale
>


## Description
A graphic scale for Leaflet with metric and/or nautical scale(s)

Based on [leaflet-graphicscale](https://github.com/nerik/leaflet-graphicscale) by [Erik Escoffier](https://github.com/nerik) 

## Installation
### bower
`bower install https://github.com/FCOO/leaflet-double-scale.git --save`

## Demo
http://FCOO.github.io/leaflet-double-scale/demo/ 

## Usage

    var myDoubleScale = L.Control.doubleScale( {
    	mode: 'both',
    	position: 'bottomleft', 
    	maxUnitsWidth: 300, 
    })
	map.addControl( myDoubleScale );



## Options

### mode: ```'metric'|'nautical'|'both'```
Default: `both`

- `'metric'`

![](readme/metric.png)

- `'nautical'`

![](readme/nautical.png)

- `'both'`

![](readme/both.png)

### position
leaflet.Control [options.position](http://leafletjs.com/reference.html#control-options)

### maxUnitsWidth
Max width of the scale
Default: `200`

## Properties and methods
	.outerElement //DOM-element that contains the scale. 

	.setMode: function( mode ); //Change between modes ("nautical", "metric" or "both")

	.onClick( func, context ); //Add click-event to the scale. Change style on mouse hover to border and less transparent 

## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/FCOO/leaflet-double-scale/LICENSE).

Copyright (c) 2015 [FCOO](https://github.com/FCOO)

## Contact information

Niels Holt nho@fcoo.dk


## Credits and acknowledgements
Erik Escoffier <https://github.com/nerik> 

