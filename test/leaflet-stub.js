/* Remplaçant minimal de Leaflet, uniquement pour les tests hors ligne. */
window.L = (()=> {
  const noop = ()=>obj, obj = {};
  const chain = o => new Proxy(o||{}, { get:(t,k)=> (k in t ? t[k] : ()=>chain({})) });
  const mk = extra => chain(Object.assign({
    addTo(){return this}, on(){return this}, bindPopup(){return this},
    openPopup(){return this}, getLatLng(){return {lat:this._ll?this._ll[0]:0,lng:this._ll?this._ll[1]:0}},
    setView(){return this}, fitBounds(){return this}, removeLayer(){return this},
    invalidateSize(){return this}, closePopup(){return this}, addAttribution(){return this}
  }, extra||{}));
  const L = {
    map:()=>mk(), tileLayer:()=>mk(), marker:(ll)=>mk({_ll:ll}),
    polyline:()=>mk(), layerGroup:()=>mk(), divIcon:()=>({}),
    latLngBounds:(a)=>a, control:{ zoom:()=>mk(), attribution:()=>mk() }
  };
  return L;
})();
