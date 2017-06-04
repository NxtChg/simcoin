
var btc_to_usd = 0, last_post_id = 0;

var el_currency = document.getElementById('currency');
var el_orders   = document.getElementById('orders');
var el_btcToUsd = document.getElementById('btc-to-usd');
var el_posts    = document.getElementById('posts');
var el_go_forum = document.getElementById('visit-forum');

var port = chrome.extension.connect({ name: "PopupToBg" }); // communication

function getLastId()
{
	if(!localStorage['last_id']) localStorage['last_id'] = 0;

	return localStorage['last_id'];
}//____________________________________________________________________________

function display_orders()
{
	displayBtcToUsdPrice();

	var tbody = document.createElement('tbody');

	var  buy_orders = JSON.parse(localStorage[ 'buy_orders'] || '[]');
	var sell_orders = JSON.parse(localStorage['sell_orders'] || '[]');

	for(var i = 0; i < 5 && i < buy_orders.length && i < sell_orders.length; i++)
	{
		var d, row = tbody.insertRow(i);

		d = row.insertCell(0); d.className = 'amount_s'; d.innerText = buy_orders[i].amount;
		d = row.insertCell(0); d.className =  'price_b'; d.innerText = calculateDisplayPrice( buy_orders[i].price);
		d = row.insertCell(0); d.className =  'price_s'; d.innerText = calculateDisplayPrice(sell_orders[i].price);
		d = row.insertCell(0); d.className = 'amount_b'; d.innerText = sell_orders[i].amount;
	}
	
	el_orders.replaceChild(tbody, el_orders.getElementsByTagName('tbody')[0]);
}//____________________________________________________________________________

function display_posts()
{
	var tbody = document.createElement('tbody');

	var posts = JSON.parse(localStorage['posts'] || '[]');

	var last_id  = getLastId();

	last_post_id = (posts.length > 0 ? posts[0].id : 0);

	for(var i = 0; i < 5 && i < posts.length; i++)
	{
		var d, row = tbody.insertRow(i);

		if(posts[i].id > last_id) row.className = 'new-post';

		d = row.insertCell(0); d.innerText = posts[i].board;
		d = row.insertCell(1); d.innerText = posts[i].subject;
		d = row.insertCell(2); d.innerText = posts[i].author;
	}

	el_posts.replaceChild(tbody, el_posts.getElementsByTagName('tbody')[0]);
}//____________________________________________________________________________

function displayBtcToUsdPrice()
{
	btc_to_usd  = localStorage['btc_to_usd'] || 0;

	el_btcToUsd.innerHTML = 'BTC/USD: <b>' + parseFloat(btc_to_usd).toFixed(0) + '</b>';
}//____________________________________________________________________________

function updateCurrency()
{
	localStorage['currency'] = el_currency.value;

	display_orders();

	port.postMessage("refreshIcon");
}//____________________________________________________________________________

var getCurrency = function()
{
	if(!localStorage['currency']) localStorage['currency'] = 'satoshis';

	return localStorage['currency'];
}//____________________________________________________________________________

function calculateDisplayPrice(price)
{
	var currency = getCurrency();
	
	price *= 100000;
	
	if(currency === 'satoshis') return Math.round(price);

	if(currency === 'usd') return Math.round(1000000 * price * (btc_to_usd / 100000000));
}//____________________________________________________________________________

port.onMessage.addListener(function(msg)
{
	if(msg === 'ordersChanged') display_orders();
	if(msg === 'postsChanged' ) display_posts ();
});//__________________________________________________________________________

el_go_forum.onclick = function(){ localStorage['last_id'] = last_post_id; localStorage['unread'] = 0; port.postMessage("refreshIcon"); };

el_currency.onchange = updateCurrency;
el_currency.value    = getCurrency();

display_orders();
display_posts();
