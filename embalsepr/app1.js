//variable global
let siteDict = {};
let act = L.control({ position: "bottomleft" });
let fechaActualizacio_emb = [];
function crearDiccionario()
{
  let url = "https://raw.githubusercontent.com/LuisAponteLopez/archivo_datos/main/embalses.json";  
  Plotly.d3.json(url,function(data){
    for(let i=0;i < data.length;i++)
    {
        siteDict[data[i].siteID] = {nombre:data[i].nombre,lat:data[i].latitude,lon:data[i].longitude,des:data[i].desborde,seg:data[i].seguridad,obs:data[i].observacion,aju:data[i].ajuste,con:data[i].control};
    }
  });
}
// función para filtrar datos
function filtraDatos(data){
  let fecha = [];
  let nivel = [];  
  const filtered = data.split('\n'); 
   let colNivel;  
   for(let i=0;i < filtered.length;i++)
  {    if (filtered[i].slice(0,9) == "agency_cd")
    {
       let header = filtered[i].split("\t");
       colNivel = header.findIndex(element => element.includes("_62616"))
     }    if(filtered[i].slice(0,4) == "USGS")
    {
       let fila = filtered[i].split('\t');
       fecha.push(fila[2]);
       nivel.push(parseFloat(fila[colNivel]));
     }
  }  return [fecha,nivel];
}
function trazaGrafica(datos,layout)
{
    Plotly.newPlot('plot', [{
        x: datos[0],
        y: datos[1],
        type: 'scatter',
        line: {color: "red" }
    }],layout,config = {responsive: true});
}
//Devuelve rango de cada embalse
function rangoIndicador(des,seg,obs,aju,con){
  let rango =[];
  rango.push(1)
  rango.push(des-seg)
  rango.push(seg-obs)
  rango.push(obs-aju)
  rango.push(aju-con)
  rango.push(1)
  return rango
}
//Dibuja arco, de izquierda a derecha
function dibujaArco(lat,lon,fin,i) {
  let radIn = 0.025;// radio arco
  let grosor = 0.02;
  let radOut = radIn + grosor;
  let temp = [];
  let tlon, tlat;
  //fin -> hasta donde llega el arco
  //arco interior
  for(let ang=Math.PI;ang >= Math.PI/100*fin;ang-=Math.PI/100){
    tlon = lon + radIn*Math.cos(ang);
    tlat = lat + radIn*Math.sin(ang);
    temp.push([tlat,tlon]);
  };
  // arco exterior 
  for(let ang=Math.PI/100*fin;ang <= Math.PI;ang+=Math.PI/100){
    tlon = lon + (radOut)*Math.cos(ang);
    tlat = lat + (radOut)*Math.sin(ang);
    temp.push([tlat,tlon]);
  };
let col = ['rgba(150, 3, 248, 0.904)','green','blue','yellow','orange','red'];
let polyline = L.polygon(temp, {color: col[i],fillOpacity:1.0}).addTo(mymap);
};
//Dibuja arco que indica el nivel actual del embalse 
function indicadorEmbalse(lat,lon,fin){
  //misma logica que la funcion dibujaArco() , linea 55
  let radIn = 0.035;
  let grosor = 0.005;
  let radOut = radIn + grosor;
  let temp = [];
  let tlon, tlat;
  for(let ang=Math.PI;ang >= (Math.PI/200)*fin;ang-=Math.PI/200){
    tlon = lon + (radIn)*Math.cos(ang);
    tlat = lat + (radIn)*Math.sin(ang);
    temp.push([tlat,tlon]);
  };
  for(let ang=(Math.PI/200)*fin;ang <= Math.PI;ang+=Math.PI/200){
    tlon = lon + radOut*Math.cos(ang);
    tlat = lat + radOut*Math.sin(ang);
    temp.push([tlat,tlon]);
  };
  let polyline = L.polygon(temp,{color:'black',fillOpacity:1.0}).addTo(mymap);
}
//Pintar el fondo de los triangulo dado su nivel y su rango 
function fondoTriangulo(num,con,aju,obs,seg,des){
  if(num<con){
    return "red"
  }else if(num<aju){
    return 'orange'
  }else if(num<obs){
    return 'yellow'
  }else if(num < seg){
    return 'blue'
  }else if(num<des){
    return 'green'
  }else{return 'rgba(150, 3, 248, 0.904)'}
}
//Devulve el nivel alerta en donde se encuentra y la posicion donde se encuentra su rango.-> un arreglo de 1x2
function lineaIndicador(num,con,aju,obs,seg,des){
  if(num<con){
    return [0,0];
  }else if(num<aju){
    return [con,1];
  }else if(num<obs){
    return [aju,2];
  }else if(num<seg){
    return [obs,3];
  }else if(num<des){
    return [seg,4];
  }else{return [des,5];}
}
//Muestra en pantalla cuando se actualizo la pantalla
function actualizacion(){
  let fecha = new Date();      
  let hora= fecha.getHours();
  let dia=['Domingo','Lunes','Martes','Miercoles','Jueves','Viernes','Sabado'];
  let mes = ["Enero","Febrero","Marzo","Abril","Mayo","Jun,io","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  
  let sistemaHorario = "<span>AM</span>" ;
  if (hora>=12){ 
    if(hora>12){hora = hora -  12;}
    sistemaHorario = "<span>PM</span>";
  }else if(hora == 0  ) hora = 12;
  //crear div y a~adir texto
  act.onAdd = function(e) {
    let div = L.DomUtil.create("div", "act");
    div.innerHTML ="<p><b>Última actualización:  "+dia[fecha.getDay()]+" "+fecha.getDate() + " de " + mes[fecha.getMonth()] + " del " + fecha.getFullYear()+" "+hora+fecha.toString().substring(18,21)+sistemaHorario;
  return div;
  }
act.addTo(mymap)
}
// Buscar embalse dado el siteID
function buscaEmbalse(miEmbalse){
  Plotly.d3.text("https://waterdata.usgs.gov/pr/nwis/uv/?format=rdb&site_no=" + miEmbalse, function(data) {    
  let datos = filtraDatos(data);
  let hora = (datos[0].pop())
 
  let num = datos[1].pop();//ultimo valor registrado
  let nombre = siteDict[miEmbalse].nombre;//nombre del embalse
  let lat = siteDict[miEmbalse].lat;//coordenada latitud
  let lon = siteDict[miEmbalse].lon;//coordenada longitud
  let des = siteDict[miEmbalse].des;//desborde
  let seg = siteDict[miEmbalse].seg;//seguridad
  let obs = siteDict[miEmbalse].obs//observación
  let aju = siteDict[miEmbalse].aju;//ajuste
  let con=siteDict[miEmbalse].con;//control
  
    fechaActualizacio_emb.push(nombre,hora)

  let colorFondo_tri =   fondoTriangulo(num,con,aju,obs,seg,des)


  let layout = {
    title: ('<b>'+nombre + "<br>nivel actual: </b>"+datos[1].pop().toFixed(2)+"m"),
    paper_bgcolor:'#ADD8E6',plot_bgcolor:'#cccccc',
    autosize: true,
    width:190, height:150,
    margin: {l: 50,r: 20,b: 55,t: 45,pad: 4},
    font: {size: 8},
    xaxis: {title: 'Fecha/hora',showgrid: true,gridwidth:1, gridcolor:'black',linecolor: 'black',linewidth: 2,mirror: true},
    yaxis: {title: 'Nivel[m]',showgrid: true, gridcolor:'black',linecolor: 'black',linewidth: 2,mirror: true,},
};
//tendencia  , triangulo y grafica
  let y1=datos[1][0];//primer valor registrado
  let y2=datos[1].pop();//ultimo valor registrado
      tendencia = ((y2-y1)/(datos[1].length));//el movimiento de los datos ,dado el primer y ultimo valor
      let tri = L.polygon([])
      if(tendencia>0){tri = L.polygon([[lat,lon-.01],[lat+.01, lon],[lat,lon+.01],],{color:'black',fillColor:colorFondo_tri,fillOpacity:1.0}).addTo(mymap)
      }else if(tendencia<0) {tri =  L.polygon([ [lat,lon-.01],[lat-.01, lon],[lat,lon+.01],],{color:'black',fillColor:colorFondo_tri,fillOpacity:1.0}).addTo(mymap);}
      else{tri = L.circle([lat,lon],1000,{color:'black',fillColor:colorFondo_tri,fillOpacity:1.0}).addTo(mymap)}
     tri.bindPopup('<div id="plot" ></div> ',{maxWidth:"auto",offset:[-90,0]})
     .on('popupopen', function (e) {
       trazaGrafica(datos,layout);
       })
  //crear indicador 
  let rango =  rangoIndicador(des,seg,obs,aju,con);//arreglo{rango nivel de alerta } 
  let total = 0 ;//Total es la sumatorio de todos los rangos de cada embalse
    for(let i of rango) {total+=i;}
  let puntoFinal = 0;//Ultimo punto , donde va a llegar el arco
  //Dibujar cada arco dependiendo su nivel de alerta
    for(let i = 0 ; i<rango.length;i++){
      dibujaArco(lat,lon,puntoFinal,i);
      puntoFinal+=parseInt(((rango[i]/total))*100);//actualiza la posición
    };
  let datoIndicador = lineaIndicador(num,con,aju,obs,seg,des)
  let sumatoria = 0;//sumatoria de todos los rangos antes del donde se encuentra el valor actual
    for (let i = 1 ; i<=datoIndicador[1];i++){sumatoria+=rango[6-i];};
  let posicionValorActuar= 100- ((num-datoIndicador[0])/total + sumatoria)/total*100//indica hasta donde llega el arco , segun su valor actual
    indicadorEmbalse(lat,lon,posicionValorActuar)
    actualizacion()
  })
};
//crear mapa
function inicializaMapa(){     
  let centro = [18.25178,-66.254513];    
  mymap = L.map('mapid',{ zoomControl:false }).setView(centro, 10);  
  let atrib1 = 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">';
  let atrib2 = 'OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>';
  let atrib  = atrib1 + atrib2;     
  let mytoken = 'pk.eyJ1IjoibWVjb2JpIiwiYSI6IjU4YzVlOGQ2YjEzYjE3NTcxOTExZTI2OWY3Y2Y1ZGYxIn0.LUg7xQhGH2uf3zA57szCyw';  
  let myLayer = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}'; 
  L.tileLayer(myLayer, {
  attribution: atrib,
  maxZoom: 18,
  id: 'mapbox/satellite-v9',
  tileSize: 512,
  zoomOffset: -1,
  accessToken: mytoken}).addTo(mymap);     
  return mymap;
}
//va embalse por embalse
function procesaEmbalses()
{
  for (const [key, value] of Object.entries(siteDict))
  {
      buscaEmbalse(key);
  }
}
inicializaMapa();
crearDiccionario();
function comenzar(){
  setTimeout(procesaEmbalses,500)
  setTimeout(function(){ comenzar() }, 500000)
}

/*Legenda*/
let legend = L.control({ position: "bottomright" });
legend.onAdd = function(e) {
  let div = L.DomUtil.create("div", "legend");
  div.innerHTML += "<h4>Niveles de alerta</h4>";
  div.innerHTML += '<i style="background: rgba(150, 3, 248, 0.904)"></i><span> Desborde</span><br>';
  div.innerHTML += '<i style="background: green"></i><span>Seguridad</span><br>';
  div.innerHTML += '<i style="background: blue"></i><span>Observación</span><br>';
  div.innerHTML += '<i style="background: yellow"></i><span>Ajuste</span><br>';
  div.innerHTML += '<i style="background: orange"></i><span>control</span><br>';
  div.innerHTML += '<i style="background: red"></i><span>Fuera de servicio</span><br>';
  return div;
};
legend.addTo(mymap);
//información del embalse 
function infoEmbalse(id,div){
  div.innerHTML = '<h4>Embalse: '+siteDict[id].nombre;
  div.innerHTML +='<h4>siteID: '+ id+'</h4>';
  div.innerHTML +='<h4>Latitud:'+ siteDict[id].lat +'</h4>';
  div.innerHTML +='<h4>Longitud:'+ siteDict[id].lon+'</h4>';
  div.innerHTML +='<h4>Desborde:'+ siteDict[id].des+'m</h4>';
  div.innerHTML +='<h4>Seguridad:'+ siteDict[id].seg+'m</h4>';
  div.innerHTML +='<h4>Observacion:'+ siteDict[id].obs+'m</h4>';
  div.innerHTML +='<h4>Ajuste:'+ siteDict[id].aju+'m</h4>';
  div.innerHTML +='<h4>control:'+ siteDict[id].con+'m</h4>';
  
}
//Un control para ver los datos al pasar el mouse ,por los triangulos. 
let info = L.control({ position: "topright" })
//div que se muestra si el mouse se encuentra encima del triangulo.
info.onAdd = function(e) {
  let div = L.DomUtil.create("div", "info");
  mymap.on('mousemove', function (e) {
    div.innerHTML =("<h4></h4>" );
    if(siteDict['50059000'].lat-.04 <e.latlng.lat && e.latlng.lat<siteDict['50059000'].lat+.04 && siteDict['50059000'].lon-.04 <e.latlng.lng && e.latlng.lng<siteDict['50059000'].lon+.04){
      infoEmbalse('50059000',div);
    }else  if(siteDict['50045000'].lat-.04 <e.latlng.lat && e.latlng.lat<siteDict['50045000'].lat+.04 && siteDict['50045000'].lon-.04 <e.latlng.lng && e.latlng.lng<siteDict['50045000'].lon+.04){
      infoEmbalse('50045000',div);
    }else  if(siteDict['50047550'].lat-.04 <e.latlng.lat && e.latlng.lat<siteDict['50047550'].lat+.04 && siteDict['50047550'].lon-.04 <e.latlng.lng && e.latlng.lng<siteDict['50047550'].lon+.04){
      infoEmbalse('50047550',div);
    }else  if(siteDict['50093045'].lat-.04 <e.latlng.lat && e.latlng.lat<siteDict['50093045'].lat+.04 && siteDict['50093045'].lon-.04 <e.latlng.lng && e.latlng.lng<siteDict['50093045'].lon+.04){
      infoEmbalse('50093045',div);
    }else  if(siteDict['50111210'].lat-.04 <e.latlng.lat && e.latlng.lat<siteDict['50111210'].lat+.04 && siteDict['50111210'].lon-.04 <e.latlng.lng && e.latlng.lng<siteDict['50111210'].lon+.04){
      infoEmbalse('50111210',div);
    }else  if(siteDict['50039995'].lat-.04 <e.latlng.lat && e.latlng.lat<siteDict['50039995'].lat+.04 && siteDict['50039995'].lon-.04 <e.latlng.lng && e.latlng.lng<siteDict['50039995'].lon+.04){
      infoEmbalse('50039995',div);
    }else  if(siteDict['50076800'].lat-.04 <e.latlng.lat && e.latlng.lat<siteDict['50076800'].lat+.04 && siteDict['50076800'].lon-.04 <e.latlng.lng && e.latlng.lng<siteDict['50076800'].lon+.04){
      infoEmbalse('50076800',div);
    }else  if(siteDict['50026140'].lat-.04 <e.latlng.lat && e.latlng.lat<siteDict['50026140'].lat+.04 && siteDict['50026140'].lon-.04 <e.latlng.lng && e.latlng.lng<siteDict['50026140'].lon+.04){
      infoEmbalse('50026140',div);
    }else  if(siteDict['50071225'].lat-.04 <e.latlng.lat && e.latlng.lat<siteDict['50071225'].lat+.04 && siteDict['50071225'].lon-.04 <e.latlng.lng && e.latlng.lng<siteDict['50071225'].lon+.04){
      infoEmbalse('50071225',div);
    }else  if(siteDict['50010800'].lat-.04 <e.latlng.lat && e.latlng.lat<siteDict['50010800'].lat+.04 && siteDict['50010800'].lon-.04 <e.latlng.lng && e.latlng.lng<siteDict['50010800'].lon+.04){
      infoEmbalse('50010800',div);
    }else  if(siteDict['50113950'].lat-.04 <e.latlng.lat && e.latlng.lat<siteDict['50113950'].lat+.04 && siteDict['50113950'].lon-.04 <e.latlng.lng && e.latlng.lng<siteDict['50113950'].lon+.04){
      infoEmbalse('50113950',div);
    }
   })
  return div;
};
info.addTo(mymap);

