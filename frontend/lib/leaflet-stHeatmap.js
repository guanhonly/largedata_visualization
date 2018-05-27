L.Heatmap = L.GridLayer.extend({
	
	
    createTile: function (coords,done) {
		
		var start = new Date().getTime();
		
        var tile = document.createElement('canvas','leaflet-tile','leaflet-zoom-animated ');
		
		
        var tileSize = this.getTileSize();
        tile.setAttribute('width', tileSize.x);
        tile.setAttribute('height', tileSize.y);

        var context = tile.getContext('2d');
		
		
		var startDate = moment(time_from).format("MM-DD");
		var endDate = moment(time_to).format("MM-DD");
		
		
		var st_tileId = coords.x + '' + coords.y + ' '+ coords.z + ' ' + startDate + ' ' + endDate;
		
	
		if( heatmapCache(st_tileId) !== undefined) {
			
			var data = heatmapCache(st_tileId);
			var entry = {
							data:data,
							context: context,
							tileSize: tileSize,
							tile_x: coords.x,
							tile_y: coords.y,
							tile_zoom: coords.z
						};
			color_tile(entry);	
		}

		else {
		
			request = $.get(url+'/tile', {
					dataset:dataset,
					level : coords.z,
					x     : coords.x,
					y     : coords.y,
					time_from: time_from,
					time_to: time_to
				},  function(data,textStatus){
						
						var count = Object.keys(data).length;
						
						if(count>1000)
							heatmapCache(st_tileId,data);
						
						if ( count != 0) {
							
							var entry = {
								data:data,
								context: context,
								tileSize: tileSize,
								tile_x: coords.x,
								tile_y: coords.y,
								tile_zoom: coords.z
							};
							var start1 = new Date().getTime();
							
							color_tile(entry);	
							var end2 = new Date().getTime();
							console.log((end2-start1));
							
						}
						
						
						var end1 = new Date().getTime();
						responseTime.push(end1-start);
						sumResponse = sumResponse+(end1-start);
						if(responseTime.length==500){
							console.log("avgReponseTime:");
							console.log(sumResponse/500);
						}
							
						
				},"json");	
		}
		// 异步绘制
        setTimeout(function() {
            done(null, tile);
        }, 200);
		
        return tile;
    }
});


function color_tile(entry) {

	var area_sum = Object.keys(entry.data).length;
    var fs = pickDrawFuncs();
	
	for (i in entry.data  ) {
      i = parseInt(i);

		  
	  x = (i) %256 ;
	  y = (i)/256 ;
	  x > 256 ? x=256:x=x;
	  x < 0 ? x=0:x=x;

	  y > 256 ? y=256:y=y;
	  y < 0 ? y=0:y=y;
		
	  count = entry.data[i];
	  

			
	  var datum = {
		  
		  count: count,
		  tile_zoom: entry.tile_zoom,
		  area_sum:area_sum,
		  x:x,
		  y:y
	  };
		
	  entry.context.fillStyle = fs.color(fs.count_transform(datum)*datum.count);//
	  
	  fs.draw(entry.context, datum);
	}
    //});
}

function pickDrawFuncs() {
    var colormaps = {
        ryw: function (count) {

				var lc = Math.log(count + 1) / Math.log(20);

				var r = Math.floor(256 * Math.min(1, lc));
				var g = Math.floor(256 * Math.min(1, Math.max(0, lc - 1)));
				var b = Math.floor(256 * Math.min(1, Math.max(0, lc - 2)));

				var a = Math.min(1, lc);

				return "rgba(" + r + "," + g + "," + b + "," + a + ")";
			
			
        },
        bbb: d3.scaleLinear()
            .domain([1, 200])
            .range(['#87CEFA', 'black'])
            .clamp(true)
    };


    var drawfuncs = {
        circle: function draw_circle(context, datum) {
            var radius = 3.0;
			
            // var midx = (datum.x0 + datum.x1) / 2;
            // var midy = (datum.y0 + datum.y1) / 2;
            context.beginPath();
            context.arc( datum.x, datum.y, radius, 0, 2 * Math.PI);
            context.fill();
        },
        rect: function draw_rect(context, datum) {
            // var width = datum.x1 - datum.x0;
            // var height = datum.y1 - datum.y0;
			var radius = 1.0;
			
			// if(datum.tile_zoom>=14)
				// radius = 4.0;
			
            context.fillRect(datum.x, datum.y,radius,radius);
        }
    };

    var transforms = {
        density_scaling: function (datum) {
            /*
             * area ~ 2 ** (-data_zoom)
             * color ~ density = count / area = count * 2 ** data_zoom
             *                                          ^^^^^^^
             *
             * The range of areas on the map is so large that most nodes
             * are a very low or very high density. To "correct" for this,
             * we scale by our current zoom level also (things get lighter
             * as we zoom in), similar to nanocubes/brightkite.
             *
             * BRIGHTNESS is linked to the UI control (see bottom of file)
             */
			// if(datum.area_sum<=100 && datum.tile_zoom>10)
				// return   Math.pow(2, datum.tile_zoom-10);
			// else
			return 1;
        },
        no_scaling: function () {
            return 1;
        }
    };

    return {
        draw: drawfuncs[PLOTTING_MODE],
        count_transform: transforms[PLOTTING_TRANSFORM],
        color: colormaps[PLOTTING_COLOR_SCALE]
    };
}

/* Controls for color scale */


		// var tileBounds = this._tileCoordsToBounds(coords);
			// sw = tileBounds.getSouthWest();
			// ne = tileBounds.getNorthEast(); 
		// bounds = [sw.lng.toFixed(4),sw.lat.toFixed(4),ne.lng.toFixed(4),ne.lat.toFixed(4)];	
		
		// console.log(time_from);
		// console.log(time_to);
		//url = "./"+ coords.x + "_" + coords.y + "_" + coords.z + ".json";
		


		// nw = tileBounds.getNorthWest();

        // context.fillStyle = 'white';
        // context.fillRect(0, 0, tileSize.x, 50);
        // context.fillStyle = 'black';
        // context.fillText('x: ' + coords.x + ', y: ' + coords.y + ', zoom: ' + coords.z, 20, 20);
        // context.fillText('lat: ' + sw.lat.toFixed(4) + ', lon: ' + sw.lng.toFixed(4), 20, 40);
        // context.strokeStyle = 'red';
        // context.beginPath();
        // context.moveTo(0, 0);
        // context.lineTo(tileSize.x-1, 0);
        // context.lineTo(tileSize.x-1, tileSize.y-1);
        // context.lineTo(0, tileSize.y-1);
        // context.closePath();
        // context.stroke();

