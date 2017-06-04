
const api_orders   = 'https://simxchg.com:555/api/orders.php';
const api_posts    = 'https://simtalk.org:444/api/recent.php';
const api_coinbase = 'https://coinbase.com/api/v1/currencies/exchange_rates';

var port, btc_to_usd, top_buy_order, top_sell_order;
//_____________________________________________________________________________

function getLastId()
{
	if(!localStorage['last_id']) localStorage['last_id'] = 0;

	return localStorage['last_id'];
}//____________________________________________________________________________

function getCurrency()
{
	if(!localStorage['currency']) localStorage['currency'] = 'satoshis';

	return localStorage['currency'];
}//____________________________________________________________________________

function getUnread()
{
	if(!localStorage['unread']) localStorage['unread'] = 0;

	return localStorage['unread'];
}//____________________________________________________________________________

function calculateDisplayPrice(price)
{
	var currency = getCurrency();
	
	price *= 100000;
	
	if(currency === 'satoshis') return Math.round(price);

	if(currency === 'usd') return Math.round(1000000 * price * (btc_to_usd / 100000000));
}//____________________________________________________________________________

var icon_img = [], icon_cnt = 0;

function draw_icon(ctx, size)
{
	var img = new Image();

	img.src = chrome.runtime.getURL('icon-'+size+'.png')

	img.onload = function()
	{
		ctx.canvas.width = size;

		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		ctx.beginPath();

		ctx.drawImage(img, 0, 0);
	
	    var unread = getUnread();

		if(unread > 0)
		{
			var r, padding, font = 'arial'; // serif

			switch(size)
			{
				case 16: r =  7; font = '11px ' + font; padding =  6; break;
				case 19: r =  8; font = '12px ' + font; padding =  6; break;
				case 64: r = 30; font = '42px ' + font; padding = 18; break;
			}

			if(false) // circle
			{
				ctx.fillStyle = 'red';
				ctx.arc(img.width - 0, 0, r, 0, 2 * Math.PI);
				ctx.fill();
			}
			else // square
			{
				var txt = (unread > 9 ? '+' : unread.toString());
	
				ctx.font = font;

				var txtWidth = ctx.measureText(txt).width;
	
				ctx.textBaseline = 'top';
				ctx.fillStyle    = 'red';
				ctx.fillRect(img.width - txtWidth - padding, 0, txtWidth + padding, parseInt(font, 10));
				ctx.fillStyle    = 'white';
				ctx.fillText(txt, img.width - txtWidth - (padding / 2), -1);
			}
		}

		icon_img[size] = ctx.getImageData(0, 0, img.width, img.height); icon_cnt++;

		if(icon_cnt >= 3)
		{
			try
			{
				chrome.browserAction.setIcon({ imageData: { 16: icon_img[16], 19: icon_img[19], 64: icon_img[64] } });
			}
			catch(e)
			{
				chrome.browserAction.setIcon({ imageData: icon_img[19] }); // old browser versions
			}
		}
	};
}//____________________________________________________________________________

function set_icon()
{
	icon_cnt = 0;

	var ctx = document.createElement('canvas').getContext('2d');
		
	draw_icon(ctx, 16);
	draw_icon(ctx, 19);
	draw_icon(ctx, 64);
}//____________________________________________________________________________

function set_badge()
{
	var txt = '';
	
	var  buy = calculateDisplayPrice(top_buy_order);
	var sell = calculateDisplayPrice(top_sell_order);

	if(getCurrency() === 'usd')
	{
		txt = Math.round((buy + sell) / 2).toString();
	}
	else
	{
		txt = sell + '-' + buy;
	}

	chrome.browserAction.setBadgeBackgroundColor({ color:'#4285f4' }); //'#000'
	chrome.browserAction.setBadgeText({ text: txt })
}//____________________________________________________________________________

function fetch_orders()
{
	fetch(api_coinbase)
		.then(function(resp){ return resp.json(); })
		.then(function(data)
		{
			if(data['btc_to_usd']){ localStorage['btc_to_usd'] = btc_to_usd = data['btc_to_usd']; }

			fetch(api_orders)
				.then(function(resp){ return resp.json(); })
				.then(function(data)
				{
				    var buy_orders  = data.buy.slice (0,5);
				    var sell_orders = data.sell.slice(0,5);

				    localStorage[ 'buy_orders'] = JSON.stringify( buy_orders);
			    	localStorage['sell_orders'] = JSON.stringify(sell_orders);

					top_buy_order  =  buy_orders[0]['price'];
					top_sell_order = sell_orders[0]['price'];

					set_badge(); if(port) port.postMessage("ordersChanged");
				});
		});
}//____________________________________________________________________________

function fetch_posts()
{
	fetch(api_posts)
		.then(function(resp){ return resp.json(); })
		.then(function(data)
		{
			var posts = data.slice(0,5);
			
			var last_id = getLastId();
			
			var unread_posts = 0;
			
			data.forEach(function(post){ if(post.id > last_id) unread_posts++; });
			
			localStorage['unread'] = unread_posts;
			localStorage['posts']  = JSON.stringify(posts);

			set_icon(); if(port) port.postMessage("postsChanged");
		});
}//____________________________________________________________________________

function refresh()
{
	fetch_orders(); fetch_posts();
}//____________________________________________________________________________

chrome.extension.onConnect.addListener(function(_port)
{
	port = _port;
	
	port.onMessage.addListener(function(msg){ if(msg == 'refreshIcon'){ set_icon(); set_badge(); } });
});//__________________________________________________________________________
/*
localStorage.removeItem('last_id');
localStorage.removeItem('unread');
localStorage.removeItem('posts');
localStorage.removeItem('buy_orders');
localStorage.removeItem('sell_orders');
*/
set_icon(); refresh();

setInterval(refresh, 5 * 60 * 1000); // 5 minutes
