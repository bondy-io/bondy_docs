# Marketplace
Learn how to write a simple marketplace with Python microservices and a VueJS web application.


## Goal
To demonstrate how quick and easy it is to setup an application network with Bondy allowing a set of microservices and a single-page web application to  communicate using RPC and Publish/Subscribe.

## Background

Say you want to build a marketplace where people can buy and sell items.


## Domain
The domain consists of the following four entities.

Marketplace
:   the place where sellers and buyers congregate to exchange goods.


Seller

:   A seller sells an item at a given starting price for a given period of time
i.e. people can bid on the item until it times out.

    There are 2 possible outcomes once the end of the sell period is reached:
    * There were no bids, the item just expired. No deal happened.
    * There was at least one bid higher than the initial price. The higher bidder wins. We have a deal.

Bid
:   an offer (a certain price) for an item listed on the marketplace. Only bids higher than the current highest price are accepted.

Buyer

:   A buyer tries to buy an item by bidding until the sell period expires.

## Design
The design of the example application is depicted in the following diagram.

<ZoomImg src="marketplace.png"/>

The application consists of the following actors.


1. **Market** - A microservice implementing a simple marketplace
2. **Bot** - A microservice that allows the creation of named bots (via its CLI). Bots will automatically bid for items.
3. **Web App** - A single page application written written in Typescript using VueJS and Autobahn JS (Browser).
4. **CLI** - A command line interface written in Python and using Autobahn Python WAMP client.
5. **User** - A human using either the CLI or the Web App.

### Bots

To spice things up, there are bots that are configured to:
* bid on any items whose prices are lower than a given limit,
* increasing the price by a given amount
* taking a given amount of time to perform the bid, i.e. lag between computing the price and actually bidding.

The reason for the bidding lag is to have some bids from the bots rejected and slow down the demo to a more more human friendly rhythm.

## Setup and Run

### Prerequisites

In order to run the marketplace and play with it you will need:
* `git`
* `make`
* [Docker](https://www.docker.com) (Docker Desktop in case you use macOS or Windows)

### Materials

All the source files required for the tutorial can be retrieved from the [GitHub `bondy-demo-marketplace` repo](https://github.com/bondy-io/bondy-demo-marketplace).
``` bash
$ git clone https://github.com/bondy-io/bondy-demo-marketplace.git
```

### Running the marketplace

How does it look like?
Just make the default (`demo_docker`) target:
``` bash
$ make
```

This will create a docker container with:
* an instance of Bondy
* a marketplace
* 4 bots ready to bid

**Note:** Bondy needs a few seconds to start, create a network and be ready to accept connection.
From the Docker containers, you will see the micro-services trying to reconnect with logs like:
```
2022-11-07T15:37:51 Connection failed with OS error: ConnectionRefusedError: [Errno 111] Connect call failed ('192.168.16.2', 18080)
2022-11-07T15:37:51 trying transport 0 ("ws://bondy:18080/ws") using connect delay 2.2569295356372576
```

### Joining the marketplace

To sell an item and see the bots competing, just open the webapp from a browser pointing at http://localhost:8080/.

**Note:** Again, since Bondy needs a few seconds to start. You may see the webpage spinning (`Loading... Please wait`) before successfully connecting and printing `No items to show`.

### Selling items

From the webpage pointing at http://localhost:8080/, you can sell an item by clicking on [SELL ITEM] on the top right corner of the page.
Enter:
* the name of the item,
* the initial price,
* the number of minutes before the deal closes.

Once you click on [Save], you'll see the bots starting competing, unless your initial price is too high, i.e. more than $10,000.

## Under the hood

Now let see how this was done and what is happening.

### The marketplace

For this to work, the marketplace (once connected to Bondy) registers a bunch of RPCs, listens to topics and publishes events.

#### WAMP client

In python, this is done based on a WAMP client (`autobahn-py`) that will handle the WAMP protocol and let us focus on the business logic.

#### Connection to Bondy

The connection to bondy is performed through a component that requires a fairly light configuration.
``` python
class Market:
    def __init__(self):

        ab_component_config = create_autobahn_component_config(user_id="market")
        self._component = Component(**ab_component_config)
        self._component.on("join", self._on_join)
```

For the marketplace, a cryptosign authentication is performed on the `com.market.demo` realm.
The component configuration will result in the following dictionary:
``` python
{
    "transports": [
        {
            "type": "websocket",
            "url": "ws://localhost:18080/ws",
            "serializers": ["json"]
        }
    ],
    "authentication": {
        "cryptosign": {
            "authid": "market",
            "privkey": PRIVATE_KEY
        }
    },
    "realm": "com.market.demo",
}
```

#### Registration

Once connected, the `_on_join` method is called with the opened session.
The marketplace registers 6 RPCs under the following URIs:
* `com.market.bidder.add`: When a new bigger joins, it has to give a name to be able to bid.
* `com.market.bidder.gone`: When a client gently leave the marketplace, i.e. no errors or interruptions.
* `com.market.get`: To get all the listed items.
* `com.market.item.bid`: To bid on a listed item.
* `com.market.item.get`: To get the details of a specific item.
* `com.market.item.sell` To put a new item on sale on the marketplace.

A registration is performed by simply calling the `register` method on the session giving the callback function and the URI.
For instance:
``` python
    def _on_join(self, session, details):

        session.register(self._get_items, "com.market.get")
```

#### Publication

Once the marketplace is connected and ready to accept items and bids, it has to notify all the micro-services connected to the same realm.
This is performed by simply publishing on the `com.market.opened` topic, i.e. calling `publish` on the session.
No arguments are needed here since it is a basic event, but some can be provided in a more general case.
``` python
    session.publish("com.market.opened")
```

### Bots

Similarly the bots connect to Bondy with their own private key.
However upon successful connections, the bots will only subscribe to the `com.market.opened` topic and wait until the marketplace is open before trying to bid on items.
The subscription is simply done by calling `subscribe` on the session:
``` python
    def _on_join(self, session, details):

        session.subscribe(self._on_market_opening, "com.market.opened")
```

Once the marketplace is open, the bots do many things, the most important ones being:
* join the marketplace by identifying themselves.
* query the marketplace for all currently available items.
* bid on any item that are under $10,000.
* subscribe to `com.market.item.added` to be notified every time a new item is on sale.
* subscribe to `com.market.item.new_price` to be notified every time there is a new big on an item.

For the first 3 actions, the bots need to call registered RPCs.
This is done by calling the `call` method on the session.
For instance when the bot Alice joins the marketplace, it calls:
``` python
    await session.call("com.market.bidder.add", "Alice")
```

**Note:** This is an asynchronous because the bot has to know if the call was successful and it was accepted in the marketplace. Similarly, bidders have to wait for the bid to return to know if it was accepted or rejected.

## For more...

The snippets here were simplified to keep the tutorial simple but for the full picture and more detail, please have a look at the code at the [GitHub `bondy-demo-marketplace` repo](https://github.com/bondy-io/bondy-demo-marketplace).
