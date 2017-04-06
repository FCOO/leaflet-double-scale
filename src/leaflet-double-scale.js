/****************************************************************************
    leaflet-double-scale.js, 

    (c) 2015, FCOO

    https://github.com/FCOO/leaflet-double-scale
    https://github.com/FCOO

****************************************************************************/
(function (L/*, window, document, undefined*/) {
    "use strict";

    L.Control.DoubleScale = L.Control.extend({
        options: {
            mode          : 'both',//'metric', 'nautical', or 'both'
            position      : 'bottomleft',
            updateWhenIdle: false,
            minUnitWidth  : 40,
            maxUnitsWidth : 200,
        },
        initialize: function ( options ) { 
             L.Util.setOptions(this, options);
        },

        onAdd: function (map) { 
            this._map = map;
            var result = L.DomUtil.create('div', 'leaflet-control-doublescale-outer');
            
            //Create and add nautical-scale
            this.naticalScale = new L.Control.SingleScale( L.extend({type:'nautical', labelPlacement:'top'}, this.options ) );
            this.naticalScale_container = this.naticalScale.onAdd( this._map );
            result.appendChild( this.naticalScale_container); 

            //Create and add metric-scale
            this.metricScale = new L.Control.SingleScale( L.extend({type:'metric', labelPlacement:'bottom'}, this.options ) );
            this.metricScale_container = this.metricScale.onAdd( this._map );
            this.metricScale._setLabelPlacement( 'bottom' );
            result.appendChild( this.metricScale_container); 
            

            this.outerElement = result;

            this.setMode( this.options.mode, result );

            return result;
        },

        onRemove: function (map) {
            this.metricScale.onRemove(map);
            this.nauticalScale.onRemove(map);
        },

        onClick: function( func, context ){ 
            L.DomUtil.addClass( this.outerElement, 'leaflet-control-doublescale-clickable' );
            L.DomEvent.disableClickPropagation( this.outerElement );
            L.DomEvent.addListener( this.outerElement, 'click', func, context );
        },

        setMode: function( mode, container ){
            this.options.mode = mode;
            container = container || this.getContainer();
            //outer container
            if (mode == 'both') 
                L.DomUtil.addClass( container, 'both');
            else
                L.DomUtil.removeClass( container, 'both');

            //naticalScale
            if ((mode == 'both') || (mode == 'nautical')){
                L.DomUtil.removeClass( this.naticalScale_container, 'hidden');
                this.naticalScale._setLabelPlacement( mode == 'both' ? 'top' : 'bottom' );
            }
            else
                L.DomUtil.addClass( this.naticalScale_container, 'hidden');
                  
            //metricScale
            if ((mode == 'both') || (mode == 'metric'))
                L.DomUtil.removeClass( this.metricScale_container, 'hidden');
            else
                L.DomUtil.addClass( this.metricScale_container, 'hidden');
        }
    });



    L.Control.SingleScale = L.Control.extend({
        options: {
            type            : 'nautical',//'metric', or 'nautical'
            updateWhenIdle  : false,
            minUnitWidth    : 40,
            maxUnitsWidth   : 200
        },

        onAdd: function (map) { 
            var result;

            this._map = map;

            //number of units on the scale, by order of preference
            this._possibleUnitsNum = [3, 5, 2, 4];

            this._possibleUnitsNumLen = this._possibleUnitsNum.length;

            //how to divide a full unit, by order of preference
            this._possibleDivisions = [1, 0.5, 0.25, 0.2];
            this._possibleDivisionsLen = this._possibleDivisions.length;
        
            this._possibleDivisionsSub = {
                1   : { num: 2, division: 0.5  },
                0.5 : { num: 5, division: 0.1  },
                0.25: { num: 5, division: 0.05 },
                0.2 : { num: 2, division: 0.1  }
            };


            //Build the scale
            result = L.DomUtil.create('div', 'leaflet-control-singlescale');

            this._scaleInner = L.DomUtil.create('div', 'leaflet-control-singlescale-inner filled filled-hollow');
            var units = L.DomUtil.create('div', 'units', this._scaleInner);

            this._units = [];
            this._unitsLbls = [];

            for (var i = 0; i < 5; i++) {
                var unit = this._buildDivision( i%2 === 0 );
                units.appendChild(unit);
                this._units.push(unit);

                var unitLbl = this._buildDivisionLbl();
                unit.appendChild(unitLbl);
                this._unitsLbls.push(unitLbl);
            }

            this._zeroLbl = L.DomUtil.create('div', 'label zeroLabel');
            this._zeroLbl.innerHTML = '0';
            this._units[0].appendChild(this._zeroLbl);


            this._setLabelPlacement( this.options.labelPlacement );

            result.appendChild( this._scaleInner );

            map.on(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
            map.whenReady(this._update, this);

            return result;
        },

        onRemove: function (map) {
            map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
        },

        _setLabelPlacement: function( labelPlacement ){
            L.DomUtil.removeClass( this._scaleInner, 'labelPlacement-top' );
            L.DomUtil.removeClass( this._scaleInner, 'labelPlacement-bottom' );
            L.DomUtil.addClass( this._scaleInner, 'labelPlacement-' + labelPlacement);
        },         
            
           
        _buildDivision: function(fill) {
            var item = L.DomUtil.create('div', 'division');
            var l1 = L.DomUtil.create('div', 'line');
            item.appendChild( l1 );

            var l2 = L.DomUtil.create('div', 'line2');
            item.appendChild( l2 );

            if (fill)  l1.appendChild( L.DomUtil.create('div', 'fill') );
            if (!fill) l2.appendChild( L.DomUtil.create('div', 'fill') );

            return item;
        },

        _buildDivisionLbl: function() {
            var itemLbl = L.DomUtil.create('div', 'label divisionLabel');
            return itemLbl;
        },

        _update: function () {
            var bounds = this._map.getBounds(),
                centerLat = bounds.getCenter().lat,
                //length of an half world arc at current lat
                halfWorldMeters = 6378137 * Math.PI * Math.cos(centerLat * Math.PI / 180),
                //length of this arc from map left to map right
                dist = halfWorldMeters * (bounds.getNorthEast().lng - bounds.getSouthWest().lng) / 180,
                size = this._map.getSize();

            if (this.options.type == 'nautical'){
                dist = dist/1.852;
            }

            if (size.x > 0) {
                this._updateScale(dist, this.options);
            }
        },

        _updateScale: function(maxMeters, options) {
            var scale = this._getBestScale(maxMeters, options.minUnitWidth, options.maxUnitsWidth);
            this._render(scale);
        },

        _getBestScale: function(maxMeters, minUnitWidthPx, maxUnitsWidthPx) {
            //favor full units (not 500, 25, etc)
            //favor multiples in this order: [3, 5, 2, 4]
            //units should have a minUnitWidth
            //full scale width should be below maxUnitsWidth
            //full scale width should be above minUnitsWidth ?

            var possibleUnits = this._getPossibleUnits( maxMeters, minUnitWidthPx, this._map.getSize().x );
            var possibleScales = this._getPossibleScales(possibleUnits, maxUnitsWidthPx);
            possibleScales.sort(function(scaleA, scaleB) {
                return scaleB.score - scaleA.score;
            });

            return possibleScales[0];
        },

        _getPossibleScales: function(possibleUnits, maxUnitsWidthPx) {
            var scales = [];
            var minTotalWidthPx = Number.POSITIVE_INFINITY;
            var fallbackScale;

            for (var i = 0; i < this._possibleUnitsNumLen; i++) {
                var numUnits = this._possibleUnitsNum[i];
                var numUnitsScore = (this._possibleUnitsNumLen-i)*0.5;

                for (var j = 0; j < possibleUnits.length; j++) {
                    var unit = possibleUnits[j];
                    var totalWidthPx = unit.unitPx * numUnits;
                    var scale = {
                            unit: unit,
                            totalWidthPx: totalWidthPx,
                            numUnits: numUnits,
                            score: 0
                        };

                    //TODO: move score calculation  to a testable method
                    var totalWidthPxScore = 1-(maxUnitsWidthPx - totalWidthPx) / maxUnitsWidthPx;
                    totalWidthPxScore *= 10;//3;

                    var score = unit.unitScore + numUnitsScore + totalWidthPxScore;

                    //penalty when unit / numUnits association looks weird
                    if (
                        unit.unitDivision === 0.25 && numUnits === 3 ||
                        unit.unitDivision === 0.5 && numUnits === 3 ||
                        unit.unitDivision === 0.25 && numUnits === 5
                    ) {
                        score -= 2;
                    }

                    scale.score = score;

                    if (totalWidthPx < maxUnitsWidthPx) {
                        scales.push(scale);
                    }

                    //keep a fallback scale in case totalWidthPx < maxUnitsWidthPx condition is never met
                    //(happens at very high zoom levels because we dont handle submeter units yet)
                    if (totalWidthPx<minTotalWidthPx) {
                        minTotalWidthPx = totalWidthPx;
                        fallbackScale = scale;
                    }
                }
            }

            if (!scales.length) 
                scales.push(fallbackScale);
            return scales;
        },

        /**
        Returns a list of possible units whose widthPx would be < minUnitWidthPx
        **/
        _getPossibleUnits: function(maxMeters, minUnitWidthPx, mapWidthPx) {
            var exp = (Math.floor(maxMeters) + '').length;

            var unitMetersPow;
            var units = [];

            for (var i = exp; i > 0; i--) {
                unitMetersPow = Math.pow(10, i);
                for (var j = 0; j < this._possibleDivisionsLen; j++) {
                    var unitMeters = unitMetersPow * this._possibleDivisions[j];
                    var unitPx = mapWidthPx * (unitMeters/maxMeters);
                    if (unitPx < minUnitWidthPx) {
                        return units;
                    }
                    units.push({
                        unitMeters: unitMeters,
                        unitPx: unitPx,
                        unitDivision: this._possibleDivisions[j],
                        unitScore: this._possibleDivisionsLen-j 
                    });
                }
            }

            return units;
        },

        _render: function(scale) {
            var displayUnit = this._getDisplayUnit(scale.unit.unitMeters);

            for (var i=0; i < this._units.length; i++) {
                var division = this._units[i];
                if (i < scale.numUnits) {
                    division.style.width = scale.unit.unitPx + 'px';
                    division.className = 'division';
                } else {
                    division.style.width = 0;
                    division.className = 'division hidden';
                }

                if (!this._unitsLbls) continue;

                var lbl = this._unitsLbls[i];
                var lblClassNames = ['label', 'divisionLabel'];
                
                if (i < scale.numUnits) {
                    var lblText = window.numeral( (i+1)*displayUnit.amount ).format('0,0[.]0');

                    if (i === scale.numUnits-1) {
                        lblText += displayUnit.unit;
                        lblClassNames.push('labelLast');
                    } 
                    else {
                        lblClassNames.push('labelSub');
                    }
                    lbl.innerHTML = lblText;
                }
                
                lbl.className = lblClassNames.join(' ');
            }
        },

        _getDisplayUnit: function(meters) {
            if (this.options.type == 'metric'){
                var displayUnit = (meters<1000) ? 'm' : 'km';
                return {
                    unit: displayUnit,
                    amount: (displayUnit === 'km') ? meters / 1000 : meters
                };
            }
            else 
                return {
                    unit  : 'nm',
                    amount: meters /1000
                };
        }
    });//end of L.Control.SingleScale = L.Control.extend({

    //*********************************************************************
    L.Map.mergeOptions({
        doubleScaleControl: false
    });

    L.Map.addInitHook(function () {
        if (this.options.doubleScaleControl) {
            this.doubleScaleControl = new L.Control.DoubleScale();
            this.addControl(this.doubleScaleControl);
        }
    });

    L.Control.doubleScale = function (options) {
        return new L.Control.DoubleScale(options);
    };

}(L, this, document));
