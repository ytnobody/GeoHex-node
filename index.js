/// GeoHex by @sa2da (http://geogames.net) is licensed under Creative Commons BY-SA 2.1 Japan License. ///

///////////[2010.12.14 v3公開]/////////
///////////[2010.12.28 zoneByCode()内のlonを±180以内に補正]/////////
///////////[2011.9.11 zoneByCode()内のh_x,h_yを補正]/////////

// namspace GeoHex;
var GeoHex = function () {};

// version: 3.01
GeoHex.version = "3.01";

// *** Share with all instances ***
var h_key = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
var h_base = 20037508.34;
var h_deg = Math.PI*(30/180);
var h_k = Math.tan(h_deg);

// *** Share with all instances ***
// private static
var calcHexSize = function (level) {
  return h_base/Math.pow(3, level+1);
};

// private class
var Zone = function (lat, lon, x, y, code) {
  this.lat = lat;
  this.lon = lon;
  this.x = x;
  this.y = y;
  this.code = code;
  this.level = this.code.length - 2;
};
Zone.prototype.getLevel = function () {
  return this.level;
};
Zone.prototype.getHexSize = function () {
  return calcHexSize(this.getLevel() + 2);
};
Zone.prototype.getHexCoords = function () {
  var h_lat = this.lat;
  var h_lon = this.lon;
  var h_xy = loc2xy(h_lon, h_lat);
  var h_x = h_xy.x;
  var h_y = h_xy.y;
  var h_deg = Math.tan(Math.PI * (60 / 180));
  var h_size = this.getHexSize();
  var h_top = xy2loc(h_x, h_y + h_deg *  h_size).lat;
  var h_btm = xy2loc(h_x, h_y - h_deg *  h_size).lat;

  var h_l = xy2loc(h_x - 2 * h_size, h_y).lon;
  var h_r = xy2loc(h_x + 2 * h_size, h_y).lon;
  var h_cl = xy2loc(h_x - 1 * h_size, h_y).lon;
  var h_cr = xy2loc(h_x + 1 * h_size, h_y).lon;
  return [
    {lat: h_lat, lon: h_l},
    {lat: h_top, lon: h_cl},
    {lat: h_top, lon: h_cr},
    {lat: h_lat, lon: h_r},
    {lat: h_btm, lon: h_cr},
    {lat: h_btm, lon: h_cl}
  ];
};
Zone.prototype.setLevel = function (level) {
  var t = this;
  var z = getZoneByLocation(this.lat, this.lon, level);

  t.lat = z.lat;
  t.lon = z.lon;
  t.x = z.x;
  t.y = z.y;
  t.code = z.code;
  t.level = z.level;

  return this;
};
Zone.prototype.getXYListBySteps = function (radius) {
	var list = new Array();

	for(var i=0;i<radius;i++){
		list[i] = new Array();
	}
		
	list[0].push((this.x) + "_" + (this.y));
	for(var i=0;i<radius;i++){
          for(var j=0;j<radius;j++){
            if(i||j){
	      if(i>=j) list[i].push((this.x + i) + "_" + (this.y + j)); else list[j].push((this.x + i) + "_" + (this.y + j)) ;
	      if(i>=j) list[i].push((this.x - i) + "_" + (this.y - j)); else list[j].push((this.x - i) + "_" + (this.y - j)) ;
              if(i>0&&j>0&&(i+j<=radius-1)){
	        list[i+j].push((this.x - i) + "_" + (this.y + j));
	        list[i+j].push((this.x + i) + "_" + (this.y - j));
	      }
            }
          }
        }
	return (list);
};
Zone.prototype.getCodesAround = function (around, execute) {
  var t = this
    , a = around || 1
    , l = t.code.length;
    ;

  if (typeof execute !== 'function') {
    execute = function (code) { return code; };
  }

  var codes = [execute(t.code)];

  for (var i = 0; i <= a; ++i) {
    for (var j = 0; j <= a; ++j) {
      if (i === 0 && j === 0) {
        continue;
      }

      codes.push(execute(hexCoords2Code(t.x + i, t.y + j, l)));
      codes.push(execute(hexCoords2Code(t.x - i, t.y - j, l)));

      if (i && j && i + j <= a) {
        codes.push(execute(hexCoords2Code(t.x - i, t.y + j, l)));
        codes.push(execute(hexCoords2Code(t.x + i, t.y - j, l)));
      }
    }
  }

  return codes;
};
Zone.prototype.getDistanceWithZone = function (zone) {
  var t = this
    , x = zone.x - t.x
    , y = zone.y - t.y
    , list = []
    , xabs = Math.abs(x)
    , yabs = Math.abs(y)
    , xqad = xabs ? x / xabs : null
    , yqad = yabs ? y / yabs : null
    , m = (xqad === yqad ? (yabs > xabs ? x : y) : 0)
    ;

  return xabs + yabs - Math.abs(m) + 1;
};

// public static
var getZoneByLocation = function (lat, lon, level) {
  level +=2;
  var h_size = calcHexSize(level);

  var z_xy = loc2xy(lon, lat);
  var lon_grid = z_xy.x;
  var lat_grid = z_xy.y;
  var unit_x = 6 * h_size;
  var unit_y = 6 * h_size * h_k;
  var h_pos_x = (lon_grid + lat_grid / h_k) / unit_x;
  var h_pos_y = (lat_grid - h_k * lon_grid) / unit_y;
  var h_x_0 = Math.floor(h_pos_x);
  var h_y_0 = Math.floor(h_pos_y);
  var h_x_q = h_pos_x - h_x_0; 
  var h_y_q = h_pos_y - h_y_0;
  var h_x = Math.round(h_pos_x);
  var h_y = Math.round(h_pos_y);

  if (h_y_q > -h_x_q + 1) {
    if((h_y_q < 2 * h_x_q) && (h_y_q > 0.5 * h_x_q)){
      h_x = h_x_0 + 1;
      h_y = h_y_0 + 1;
    }
  } else if (h_y_q < -h_x_q + 1) {
    if ((h_y_q > (2 * h_x_q) - 1) && (h_y_q < (0.5 * h_x_q) + 0.5)){
      h_x = h_x_0;
      h_y = h_y_0;
    }
  }

  var h_lat = (h_k * h_x * unit_x + h_y * unit_y) / 2;
  var h_lon = (h_lat - h_y * unit_y) / h_k;

  var z_loc = xy2loc(h_lon, h_lat);
  var z_loc_x = z_loc.lon;
  var z_loc_y = z_loc.lat;
  if(h_base - h_lon < h_size){
    z_loc_x = 180;
    var h_xy = h_x;
    h_x = h_y;
    h_y = h_xy;
  }

  var h_code ="";
  var code3_x =new Array();
  var code3_y =new Array();
  var code3 ="";
  var code9="";
  var mod_x = h_x;
  var mod_y = h_y;


  for(i = 0;i <= level ; i++){
    var h_pow = Math.pow(3,level-i);
    if(mod_x >= Math.ceil(h_pow/2)){
      code3_x[i] =2;
      mod_x -= h_pow;
    }else if(mod_x <= -Math.ceil(h_pow/2)){
      code3_x[i] =0;
      mod_x += h_pow;
    }else{
      code3_x[i] =1;
    }
    if(mod_y >= Math.ceil(h_pow/2)){
      code3_y[i] =2;
      mod_y -= h_pow;
    }else if(mod_y <= -Math.ceil(h_pow/2)){
      code3_y[i] =0;
      mod_y += h_pow;
    }else{
      code3_y[i] =1;
    }
  }

  for(i=0;i<code3_x.length;i++){
    code3 += ("" + code3_x[i] + code3_y[i]);
    code9 += parseInt(code3,3);
    h_code += code9;
    code9="";
    code3="";
  }
  var h_2 = h_code.substring(3);
  var h_1 = h_code.substring(0,3);
  var h_a1 = Math.floor(h_1/30);
  var h_a2 = h_1%30;
  h_code = (h_key.charAt(h_a1)+h_key.charAt(h_a2)) + h_2;

  return new Zone(z_loc_y, z_loc_x, h_x, h_y, h_code);
};

var getZoneByCode = function (code) {
  var level = code.length;
  var h_size =  calcHexSize(level);
  var unit_x = 6 * h_size;
  var unit_y = 6 * h_size * h_k;
  var h_x = 0;
  var h_y = 0;
  var h_dec9 =""+ (h_key.indexOf(code.charAt(0))*30+h_key.indexOf(code.charAt(1)))+code.substring(2);
  if(h_dec9.charAt(0).match(/[15]/)&&h_dec9.charAt(1).match(/[^125]/)&&h_dec9.charAt(2).match(/[^125]/)){
    if(h_dec9.charAt(0)==5){
    h_dec9 = "7"+h_dec9.substring(1,h_dec9.length);
    }else if(h_dec9.charAt(0)==1){
    h_dec9 = "3"+h_dec9.substring(1,h_dec9.length);
    }
  }
  var d9xlen = h_dec9.length;
  for(i=0;i<level +1 - d9xlen;i++){
    h_dec9 ="0"+h_dec9;
    d9xlen++;
  }
  var h_dec3 = "";
  for(i=0;i<d9xlen;i++){
    var h_dec0=parseInt(h_dec9.charAt(i)).toString(3);
    if(!h_dec0){
      h_dec3 += "00";
    }else if(h_dec0.length==1){
      h_dec3 += "0";
    }
    h_dec3 += h_dec0;
  }

  h_decx =new Array();
  h_decy =new Array();
  
  for(i=0;i<h_dec3.length/2;i++){
    h_decx[i]=h_dec3.charAt(i*2);
    h_decy[i]=h_dec3.charAt(i*2+1);
  }

  for(i=0;i<=level;i++){
      var h_pow = Math.pow(3,level-i);
      if(h_decx[i] == 0){
          h_x -= h_pow;
      }else if(h_decx[i] == 2){
          h_x += h_pow;
      }
      if(h_decy[i] == 0){
          h_y -= h_pow;
      }else if(h_decy[i] == 2){
          h_y += h_pow;
      }
  }

  var h_lat_y = (h_k * h_x * unit_x + h_y * unit_y) / 2;
  var h_lon_x = (h_lat_y - h_y * unit_y) / h_k;

  var h_loc = xy2loc(h_lon_x, h_lat_y);
  if(h_loc.lon>180){
     h_loc.lon -= 360;
     h_x -= Math.pow(3,level);    // v3.01
     h_y += Math.pow(3,level);    // v3.01
  }else if(h_loc.lon<-180){
     h_loc.lon += 360;
     h_x += Math.pow(3,level);    // v3.01
     h_y -= Math.pow(3,level);    // v3.01
  }
  return new Zone(h_loc.lat, h_loc.lon, h_x, h_y, code);
};

// private static
var loc2xy = function (lon, lat) {
  var x = lon * h_base / 180;
  var y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
  y *= h_base / 180;
  return { x: x, y: y };
};
// private static
var xy2loc = function (x, y) {
  var lon = (x / h_base) * 180;
  var lat = (y / h_base) * 180;
  lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
  return { lon: lon, lat: lat };
};

var hexCoords2Code = function (hexX, hexY, length) {
  var h_code ="";
  var code3_x =new Array();
  var code3_y =new Array();
  var code3 ="";
  var code9="";
  var mod_x = hexX;
  var mod_y = hexY;

  for(i = 0;i <= length ; i++){
    var h_pow = Math.pow(3,length-i);
    if(mod_x >= Math.ceil(h_pow/2)){
      code3_x[i] =2;
      mod_x -= h_pow;
    }else if(mod_x <= -Math.ceil(h_pow/2)){
      code3_x[i] =0;
      mod_x += h_pow;
    }else{
      code3_x[i] =1;
    }
    if(mod_y >= Math.ceil(h_pow/2)){
      code3_y[i] =2;
      mod_y -= h_pow;
    }else if(mod_y <= -Math.ceil(h_pow/2)){
      code3_y[i] =0;
      mod_y += h_pow;
    }else{
      code3_y[i] =1;
    }
  }

  for(i=0;i<code3_x.length;i++){
    code3 += ("" + code3_x[i] + code3_y[i]);
    code9 += parseInt(code3,3);
    h_code += code9;
    code9="";
    code3="";
  }
  var h_2 = h_code.substring(3);
  var h_1 = h_code.substring(0,3);
  var h_a1 = Math.floor(h_1/30);
  var h_a2 = h_1%30;

  return (h_key.charAt(h_a1)+h_key.charAt(h_a2)) + h_2;
};

// EXPORT
GeoHex.getZoneByLocation = getZoneByLocation;
GeoHex.getZoneByCode = getZoneByCode;

module.exports = GeoHex;
