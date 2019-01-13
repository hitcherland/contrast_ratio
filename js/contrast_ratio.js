var ContrastRatio = ( () => {
    var I = '(\\d+)';
    var F = '(\\d+\\.\\d*|\\.\\d+|\\d+)'
    var F01 = '([01]\\.\\d*|\\.\\d+|[01])'
    var rgb_regex = new RegExp( `^rgb\\(${I},${I},*{I}\\)`);
    var rgba_regex = new RegExp( `^rgb\\(${I},${I},${I},${I}\\)`);
    var srgb_regex = new RegExp( `^srgb\\(${F01},${F01},*{F01}\\)`);
    var srgba_regex = new RegExp( `^srgb\\(${F01},${F01},${F01},${F01}\\)`);
    var hsv_regex = new RegExp( `^hsv\\(${I},${F01},${F01}\\)`);

    class Colour {
        constructor( r, g, b, a ) {
            if( typeof r === "string" && r.startsWith( '#' ) ) 
                this._parseHex( r );
            else if( typeof r === "string" && rgb_regex.test( r ) ) {
                var data = rgb_regex.exec( r );
                this._R = parseInt( data[ 1 ] );
                this._G = parseInt( data[ 2 ] );
                this._B = parseInt( data[ 3 ] );
            }
            else if( typeof r === "string" && rgba_regex.test( r ) ) {
                var data = rgb_regex.exec( r );
                this._R = parseInt( data[ 1 ] );
                this._G = parseInt( data[ 2 ] );
                this._B = parseInt( data[ 3 ] );
                this._A = parseInt( data[ 4 ] );
            }
            else if( typeof r === "string" && hsv_regex.test( r ) ) {
                var data = hsv_regex.exec( r );
                var h = parseInt( data[ 1 ] ), s = parseFloat( data[ 2 ] ), v = parseFloat( data[ 3 ] );
                var C = v * s;
                var H = ( h / 60 ) % 6 ;
                var X = C * ( 1 - Math.abs( H % 2 - 1 ) );
                if( 0 <= H && H < 1 )
                    var RGB1 = [ C, X, 0 ];
                else if( 1 <= H && H < 2 )
                    var RGB1 = [ X, C, 0 ];
                else if( 2 <= H && H < 3 )
                    var RGB1 = [ 0, C, X ];
                else if( 3 <= H && H < 4 )
                    var RGB1 = [ 0, X, C ];
                else if( 4 <= H && H < 5 )
                    var RGB1 = [ X, 0, C ];
                else if( 5 <= H && H < 6 )
                    var RGB1 = [ C, 0, X ];
                var m = v - C;
                this._R = Math.ceil( ( RGB1[ 0 ] + m ) * 255 );
                this._G = Math.ceil( ( RGB1[ 1 ] + m ) * 255 );
                this._B = Math.ceil( ( RGB1[ 2 ] + m ) * 255 );
            }

            else if( this._isInt( r ) && g === undefined ) {
                if( r < 0 ) {
                    this._R = r >> 24;
                    this._G = r && 0x00ffff00 >> 16;
                    this._B = r && 0x0000ff00 >> 8;
                    this._A = r && 0x000000ff;
                } else {
                    this._R = r >> 16;
                    this._G = r && 0x00ffff >> 8;
                    this._B = r && 0x0000ff;
                    this._A = undefined;
                }
            }
            else if( this._isInt( r ) && this._isInt( g ) && this._isInt( b ) ) {
                this._R = r; 
                this._G = g;
                this._B = b;
                var depth = [ r, g, b ].reduce( (max,v) => {
                    var d = Math.ceil( Math.log( v + 1 ) / Math.log( 16 ) );
                    return d > max ? d : max;
                }, 0 );
                if( depth < 2 ) depth = 2;
                this._A = this._isInt( a ) ? a : undefined;
                this._depth = [ r, g, b, a ].reduce( (max,v) => {
                    var d = Math.ceil( Math.log( v + 1 ) / Math.log( 16 ) );
                    return d > max ? d : max;
                }, 0 );
            }
            else if( this._is0to1( r ) && this._is0to1( g ) && this._is0to1( b ) ) {
                this._R = r * 255; 
                this._G = g * 255;
                this._B = b * 255;
                this._depth = 2;
                this._A = this._is0to1( a ) ? a : undefined;
            }
        };
        _isNumber( x ) {
            return Number( x ) === x;
        };
        _isInt( x ) {
            return this._isNumber( x ) && x.toString().replace( /[^.]/g, '' ).length == 0;
        };
        _isFloat( x ) {
            return this._isNumber( x ) && x.toString().replace( /[^.]/g, '' ).length == 1;
        };
        _is0to1( x ) {
            return this._isFloat( x ) && x >= 0 && x <= 1;
        }
        _parseHex( hex ) {
            var l = hex.length - 1;
            var string = hex.slice( 1 );
            if( l % 3 == 0 ) {
                var chunk = l / 3;
                this._R = parseInt( string.slice( 0, chunk ), 16 );
                this._G = parseInt( string.slice( chunk, 2 * chunk ), 16 );
                this._B = parseInt( string.slice( 2 * chunk, 3 * chunk ), 16 );
                this._A = 255;
            }
            else if( l % 4 == 0 ) {
                var chunk = l / 4;
                this._R = parseInt( string.slice( 0, chunk ), 16 );
                this._G = parseInt( string.slice( chunk, 2 * chunk ), 16 );
                this._B = parseInt( string.slice( 2 * chunk, 3 * chunk ), 16 );
                this._A = parseInt( string.slice( 3 * chunk, 4 * chunk ), 16 );
            }
            else {
                throw "Invalid Hexadecimal definition of colour"
            }
        }

        get _rgb() { return [ this._R, this._G, this._B ]; }
        get _rgba() { return [ this._R, this._G, this._B, this._A ]; }

        get _srgb() { return [ this._R / 255, this._G / 255, this._B / 255 ]; }
        get _rgba() { return [ this._R / 255, this._G / 255, this._B / 255, this._A / 255 ]; }

        get _hsv() {
            var M = Math.max( this._R, this._G, this._B );
            var m = Math.min( this._R, this._G, this._B );
            var C = M - m;

            var H;
            if ( C == 0 )
                H = 0;
            else if ( M == this._R )
                H = ( this._G - this._B / C ) % 6;
            else if ( M == this._G  )
                H = ( this._B - this._R / C ) + 2;
            else if ( M == this._B  )
                H = ( this._R - this._G / C ) + 4;

            var V = M;
            var S = M == 0 ? 0 : C / V;
            
            return [ Math.round( H * 60 ), S / 255 , V / 255 ];
        }

        get _hex() {
            var h = 0;
            var i = 0;

            var hex = (this._R << 16) + (this._G << 8) + this._B;
            if( this._A !== undefined ) {
                hex = ( hex << 8 ) + this._A;
            }
            return hex;
        }

        get rgb() { var arr = this._rgb; return `rgb(${arr[0]},${arr[1]},${arr[2]})`; }
        get rgba() { var arr = this._rgba; return `rgb(${arr[0]},${arr[1]},${arr[2]},${arr[3]})`; }
        get srgb() { var arr = this._srgb; return `rgb(${arr[0]},${arr[1]},${arr[2]})`; }
        get srgba() { var arr = this._srgba; return `rgb(${arr[0]},${arr[1]},${arr[2]},${arr[3]})`; }
        get hex() { var h = this._hex; if( h<0 ) h = 0xFFFFFFFF + h + 1; return "#" + ( h >> 20 == 0 ? '0' : '' ) + h.toString( 16 ).toUpperCase(); }
        get hsv() { var arr = this._hsv; return `hsv(${arr[0]},${arr[1]},${arr[2]})`; }

        contrast_ratio( other ) {
            //see https://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
            var LA = this.relative_luminance;
            var LB = other.relative_luminance;
            var L1, L2;
            if( LA > LB ) {
                L1 = LA; L2 = LB;
            } else {
                L1 = LB; L2 = LA;
            }
            return ( L1 + 0.05 ) / ( L2 + 0.05 );
        }

        get relative_luminance() {
            //see https://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
            var luminance_multipliers = [ 0.2126, 0.7152, 0.0722 ];
            var srgb = this._srgb;
            var adjusted_colour = srgb.map( x => {
                return x <= 0.03928 ? x/12.92 : Math.pow( ( x + 0.055 ) / 1.055 , 2.4 );
            });
            return adjusted_colour.reduce( (sum,value,index) => sum + value * luminance_multipliers[ index ], 0 );
        }

        reverse_contrast_ratio( ratio ) {
            var L = this.relative_luminance;
            // R = (L1+0.05)/(L2+0.05);
            // L1 = R/(L2+0.05) - 0.05
            // L2 = (L1+0.05)/R - 0.05
            var higher_rl = ( L + 0.05 ) * ratio - 0.05;
            var lower_rl = ( L + 0.05 ) / ratio - 0.05;
            var Ls = [];
            if( higher_rl <= 1 )
                Ls.push( higher_rl );
            if( lower_rl >= 0 )
                Ls.push( lower_rl );

            function reverse_luminance_multiply( L ) {
                var lm = [ 0.2126, 0.7152, 0.0722 ];
                var balance = lm.map( x => x * L );
                return balance;
            }

            function reverse_adjust_multiply( adjusted ) {
                return adjusted.map( x => 
                    x <= 0.03928 / 12.92 ? x * 12.92 : Math.pow( x, 1/2.4 ) * 1.055 -0.055 
               );
            }

            return Ls.map( l => {
                var adjusted = reverse_luminance_multiply( l );
                var srgb = reverse_adjust_multiply( adjusted );
                return new Colour( ...srgb.map( x => Math.ceil( x * 255 ) ) );
            });;
        }
    }

   
    return {
        Colour: Colour,
        white: new Colour( 255, 255, 255 ),
        red: new Colour( 255, 0, 0 ),
        black: new Colour( 0, 0, 0 ),
        hsv_regex: hsv_regex,
    }
} )();

window.onload = function() {
    var red_e = document.createElement( 'div' );
    red_e.id = "red";
    red_e.setAttribute( "style", `background:${ContrastRatio.red.rgb}; height:200px; margin: 10px`  );
    document.body.appendChild( red_e );

    var high_contrast = ContrastRatio.red.reverse_contrast_ratio( 4.5 );
    high_contrast.forEach( x => {
        var div = document.createElement( 'div' );
        div.setAttribute( "style", `background:${x.rgb}; height:10px; width: 10px`  );
        red_e.appendChild( div );
    });


    var canvas = document.getElementById( 'color_swatch' )
    canvas.width = 360;
    canvas.height = 100;
    var ctx = canvas.getContext( '2d' );

    var canvas2 = document.getElementById( 'color_reveal' )
    canvas2.width = 360;
    canvas2.height = 100;
    var ctx2 = canvas2.getContext( '2d' );
    
    var activeColour = ContrastRatio.red;
    var V = high_contrast[ 0 ]._hsv[ 2 ];
    for( var H = 0; H < 360; H++ ) { 
        for( var S = 0; S <= 1 ; S+=0.01 ) { 
            var colour = new ContrastRatio.Colour( `hsv(${H},${S},0.5)` );
            var colour2 = new ContrastRatio.Colour( `hsv(${H},${S},${V})` );
            var x = H;
            var y = 100 - S * 100;
            ctx.fillStyle = colour.rgb;
            ctx.fillRect( x, y, 1, 1 );

            if( activeColour.contrast_ratio( colour2 ) >= 4.5 ) {
                ctx2.fillStyle = colour2.rgb;
                ctx2.fillRect( x, y, 1, 1 );
            } else {
                ctx2.fillStyle = "#000";
                ctx2.fillRect( x, y, 1, 1 );
            }
        }
    }

    function changeRed( e ) {
        var H = e.clientX, S = 1 - e.clientY / 100;
        var colour = new ContrastRatio.Colour( `hsv(${H},${S},0.5)` );
        activeColour = colour;
        
        var red = document.getElementById( 'red' );
        high_contrast = colour.reverse_contrast_ratio( 4.5 );
        if( high_contrast.length == 0 ) {
            var V = 0;
        } else {
 //           console.log( high_contrast[ 0 ] );
            var V = high_contrast[ 0 ]._hsv[ 2 ];
        }
        
        red.setAttribute( "style", `background:${colour.rgb}; height:200px; margin: 10px` );
        while (red.firstChild) {
            red.removeChild(red.firstChild);
        }
        high_contrast.forEach( x => {
            var div = document.createElement( 'div' );
            div.setAttribute( "style", `background:${x.rgb}; height:100px; width: 100px`  );
            red_e.appendChild( div );
        });

    }

    canvas.onmousedown = function( e ) {
        changeRed( e );
        canvas.onmousemove = function( e ) {
            changeRed( e );
        }
    }

    canvas.onmouseup = function( e ) {
        canvas.onmousemove = undefined;

        var V = high_contrast[ 0 ]._hsv[ 2 ];
        for( var H = 0; H < 360; H++ ) { 
            for( var S = 0; S <= 1 ; S+=0.01 ) { 
                var colour = new ContrastRatio.Colour( `hsv(${H},${S},${V})` );
                var x = H;
                var y = 100 - S * 100;

                if( activeColour.contrast_ratio( colour ) >= 3.5 ) {
                    ctx2.fillStyle = colour.rgb;
                    ctx2.fillRect( x, y, 1, 1 );
                } else {
                    ctx2.fillStyle = "#000";
                    ctx2.fillRect( x, y, 1, 1 );
                }
            }
        }
    }

    canvas.onmouseout = function( e ) {
        canvas.onmousemove = undefined;
    }
}

