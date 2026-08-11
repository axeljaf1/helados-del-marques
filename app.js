const KEY="helados_del_marques_v1";
const defaultData={
  products:[
    {id:1,name:"Helado — Chico",price:30,stock:40,min:10,emoji:"🍦"},
    {id:2,name:"Helado — Mediano",price:35,stock:30,min:8,emoji:"🍨"},
    {id:3,name:"Helado — Grande",price:80,stock:18,min:5,emoji:"🍧"}
  ],
  sales:[],
  movements:[]
};
let data=JSON.parse(localStorage.getItem(KEY)||"null")||defaultData;
let cart=[];

const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const money=n=>new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(n);
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));
const dateTime=()=>new Date().toLocaleString("es-MX",{dateStyle:"short",timeStyle:"short"});
const todayKey=()=>new Date().toLocaleDateString("es-MX");

function showToast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
function go(view){
  $$(".view").forEach(v=>v.classList.remove("active-view"));
  $(`#${view}`).classList.add("active-view");
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  const names={dashboard:"Dashboard",ventas:"Ventas",inventario:"Inventario",caja:"Flujo de caja",reportes:"Reportes"};
  $("#pageTitle").textContent=names[view]||"Dashboard";
  render();
  window.scrollTo({top:0,behavior:"smooth"});
}
$$("[data-view]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.view)));
$("#mobileMenu").onclick=()=>$(".sidebar").classList.toggle("open");
$("#today").textContent=new Date().toLocaleDateString("es-MX",{weekday:"short",day:"2-digit",month:"short"});

function render(){
  renderDashboard();renderProducts();renderCart();renderInventory();renderCash();renderReports();
}
function salesToday(){return data.sales.filter(s=>s.dateKey===todayKey())}
function renderDashboard(){
  const s=salesToday(), total=s.reduce((a,x)=>a+x.total,0);
  $("#kpiSales").textContent=money(total);$("#kpiSalesCount").textContent=`${s.length} ${s.length===1?"operación":"operaciones"}`;
  $("#kpiProducts").textContent=data.products.length;
  $("#kpiLow").textContent=data.products.filter(p=>p.stock<=p.min).length;
  const balance=data.movements.reduce((a,m)=>a+(m.type==="Entrada"?m.amount:-m.amount),0);
  $("#kpiCash").textContent=money(balance);
  const recent=data.sales.slice(-6).reverse();
  $("#recentSales").innerHTML=recent.length?`<table class="table"><thead><tr><th>Hora</th><th>Productos</th><th>Pago</th><th>Total</th></tr></thead><tbody>${recent.map(s=>`<tr><td>${s.time}</td><td>${s.items.map(i=>`${i.qty}× ${i.name}`).join(", ")}</td><td>${s.payment}</td><td><strong>${money(s.total)}</strong></td></tr>`).join("")}</tbody></table>`:`<div class="empty">Aún no hay ventas registradas.</div>`;
  const map={};data.sales.forEach(s=>s.items.forEach(i=>{map[i.name]=(map[i.name]||0)+i.qty}));
  const top=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);
  $("#topProducts").innerHTML=top.length?top.map((x,i)=>`<div class="rank"><div class="rank-num">${i+1}</div><div class="rank-info"><strong>${x[0]}</strong><small>${x[1]} unidades</small></div></div>`).join(""):`<div class="empty">Las ventas aparecerán aquí.</div>`;
}
function renderProducts(){
  $("#saleProducts").innerHTML=data.products.map(p=>`<button class="product-card" onclick="addToCart(${p.id})" ${p.stock<=0?"disabled":""}><div class="product-emoji">${p.emoji}</div><strong>${p.name}</strong><small>Stock: ${p.stock}</small><span class="price">${money(p.price)}</span></button>`).join("");
}
window.addToCart=id=>{
  const p=data.products.find(x=>x.id===id);if(!p||p.stock<=0)return showToast("Producto sin stock");
  const c=cart.find(x=>x.id===id);
  if(c){if(c.qty>=p.stock)return showToast("No hay más stock disponible");c.qty++}else cart.push({id:p.id,name:p.name,price:p.price,qty:1});
  renderCart();
};
window.changeQty=(id,d)=>{
  const c=cart.find(x=>x.id===id),p=data.products.find(x=>x.id===id);if(!c)return;
  c.qty+=d;if(c.qty<=0)cart=cart.filter(x=>x.id!==id);if(c.qty>p.stock)c.qty=p.stock;renderCart();
};
function renderCart(){
  const count=cart.reduce((a,x)=>a+x.qty,0),total=cart.reduce((a,x)=>a+x.qty*x.price,0);
  $("#cartCount").textContent=`${count} ${count===1?"producto":"productos"}`;$("#cartTotal").textContent=money(total);
  $("#cartItems").innerHTML=cart.length?cart.map(c=>`<div class="cart-row"><div class="cart-row-info"><strong>${c.name}</strong><small>${money(c.price)} c/u</small></div><div class="qty"><button onclick="changeQty(${c.id},-1)">−</button><b>${c.qty}</b><button onclick="changeQty(${c.id},1)">+</button></div></div>`).join(""):`<div class="empty">Agrega productos al ticket.</div>`;
}
$("#clearCart").onclick=()=>{cart=[];renderCart()};
$("#completeSale").onclick=()=>{
  if(!cart.length)return showToast("Agrega al menos un producto");
  const total=cart.reduce((a,x)=>a+x.qty*x.price,0), payment=$("#paymentMethod").value;
  cart.forEach(c=>{const p=data.products.find(x=>x.id===c.id);p.stock-=c.qty});
  const d=new Date();
  data.sales.push({id:Date.now(),dateKey:todayKey(),time:d.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}),items:cart.map(x=>({...x})),total,payment});
  data.movements.push({id:Date.now()+1,dateKey:todayKey(),time:d.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}),type:"Entrada",category:"Venta",description:"Venta de helados",amount:total});
  cart=[];save();render();showToast("Venta registrada correctamente");
};
function renderInventory(){
  $("#inventoryTable").innerHTML=`<table class="table"><thead><tr><th>Producto</th><th>Precio</th><th>Stock</th><th>Mínimo</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${data.products.map(p=>`<tr><td>${p.emoji} <strong>${p.name}</strong></td><td>${money(p.price)}</td><td>${p.stock}</td><td>${p.min}</td><td><span class="badge ${p.stock<=p.min?"low":"ok"}">${p.stock<=p.min?"Stock bajo":"En existencia"}</span></td><td><button class="text-btn" onclick="editProduct(${p.id})">Editar</button></td></tr>`).join("")}</tbody></table>`;
}
function openModal(html){$("#modalContent").innerHTML=html;$("#modal").classList.remove("hidden")}
$("#modalClose").onclick=()=>$("#modal").classList.add("hidden");
$("#addProduct").onclick=()=>openModal(`<h2>Nuevo producto</h2><p class="section-head p">Agrega una presentación de helado.</p><form id="productForm" class="form-grid"><div class="form-group"><label>Nombre</label><input name="name" class="form-input" required></div><div class="form-group"><label>Precio</label><input name="price" type="number" step=".01" min="0" required></div><div class="form-group"><label>Stock inicial</label><input name="stock" type="number" min="0" required></div><div class="form-group"><label>Stock mínimo</label><input name="min" type="number" min="0" value="5" required></div><div class="form-actions"><button type="button" class="btn" onclick="$('#modal').classList.add('hidden')">Cancelar</button><button class="btn primary">Guardar</button></div></form>`);
document.addEventListener("submit",e=>{
 if(e.target.id==="productForm"){e.preventDefault();const f=new FormData(e.target);data.products.push({id:Date.now(),name:f.get("name"),price:+f.get("price"),stock:+f.get("stock"),min:+f.get("min"),emoji:"🍦"});save();$("#modal").classList.add("hidden");render();showToast("Producto agregado")}
 if(e.target.id==="movementForm"){e.preventDefault();const f=new FormData(e.target);data.movements.push({id:Date.now(),dateKey:todayKey(),time:new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}),type:f.get("type"),category:f.get("category"),description:f.get("description"),amount:+f.get("amount")});save();$("#modal").classList.add("hidden");render();showToast("Movimiento registrado")}
});
window.editProduct=id=>{
 const p=data.products.find(x=>x.id===id);
 openModal(`<h2>Editar producto</h2><form id="editProductForm" class="form-grid"><input type="hidden" name="id" value="${p.id}"><div class="form-group"><label>Nombre</label><input name="name" value="${p.name}" required></div><div class="form-group"><label>Precio</label><input name="price" type="number" step=".01" value="${p.price}" required></div><div class="form-group"><label>Stock</label><input name="stock" type="number" value="${p.stock}" required></div><div class="form-group"><label>Stock mínimo</label><input name="min" type="number" value="${p.min}" required></div><div class="form-actions"><button type="button" class="btn" onclick="$('#modal').classList.add('hidden')">Cancelar</button><button class="btn primary">Guardar</button></div></form>`);
};
document.addEventListener("submit",e=>{if(e.target.id==="editProductForm"){e.preventDefault();const f=new FormData(e.target),p=data.products.find(x=>x.id==f.get("id"));p.name=f.get("name");p.price=+f.get("price");p.stock=+f.get("stock");p.min=+f.get("min");save();$("#modal").classList.add("hidden");render();showToast("Producto actualizado")}});
$("#addMovement").onclick=()=>openModal(`<h2>Nuevo movimiento</h2><form id="movementForm" class="form-grid"><div class="form-group"><label>Tipo</label><select name="type"><option>Entrada</option><option>Salida</option></select></div><div class="form-group"><label>Categoría</label><select name="category"><option>Venta</option><option>Compra</option><option>Gasto</option><option>Otro</option></select></div><div class="form-group"><label>Descripción</label><input name="description" required placeholder="Ej. compra de insumos"></div><div class="form-group"><label>Monto</label><input name="amount" type="number" step=".01" min="0" required></div><div class="form-actions"><button type="button" class="btn" onclick="$('#modal').classList.add('hidden')">Cancelar</button><button class="btn primary">Guardar</button></div></form>`);
function renderCash(){
 const ins=data.movements.filter(m=>m.type==="Entrada").reduce((a,m)=>a+m.amount,0),outs=data.movements.filter(m=>m.type==="Salida").reduce((a,m)=>a+m.amount,0);
 $("#cashIn").textContent=money(ins);$("#cashOut").textContent=money(outs);$("#cashBalance").textContent=money(ins-outs);
 const rows=data.movements.slice().reverse();
 $("#cashTable").innerHTML=rows.length?`<table class="table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Monto</th></tr></thead><tbody>${rows.map(m=>`<tr><td>${m.dateKey} ${m.time}</td><td><span class="badge ${m.type==="Entrada"?"ok":"low"}">${m.type}</span></td><td>${m.category}</td><td>${m.description}</td><td><strong>${m.type==="Entrada"?"+":"-"}${money(m.amount)}</strong></td></tr>`).join("")}</tbody></table>`:`<div class="empty">No hay movimientos registrados.</div>`;
}
function renderReports(){
 const map={};data.sales.forEach(s=>s.items.forEach(i=>{if(!map[i.name])map[i.name]={qty:0,total:0};map[i.name].qty+=i.qty;map[i.name].total+=i.qty*i.price}));
 const vals=Object.entries(map).sort((a,b)=>b[1].total-a[1].total);
 $("#reportProducts").innerHTML=vals.length?vals.map(([n,v])=>`<div class="rank"><div class="rank-info"><strong>${n}</strong><small>${v.qty} unidades</small></div><div class="rank-price">${money(v.total)}</div></div>`).join(""):`<div class="empty">Sin datos todavía.</div>`;
 const pay={};data.sales.forEach(s=>pay[s.payment]=(pay[s.payment]||0)+s.total);
 const total=Object.values(pay).reduce((a,b)=>a+b,0)||1;
 $("#reportPayments").innerHTML=Object.entries(pay).length?Object.entries(pay).map(([n,v])=>`<div class="rank"><div class="rank-info"><strong>${n}</strong><small>${Math.round(v/total*100)}% del total</small></div><div class="rank-price">${money(v)}</div></div>`).join(""):`<div class="empty">Sin cobros registrados.</div>`;
}
render();
