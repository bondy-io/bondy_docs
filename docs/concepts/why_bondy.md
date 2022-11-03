---
draft: true
---
# Why Bondy
> Learn why we created Bondy to reduce accidental complexity and bring back the joy to distributed systems programming.
{.definition}



## TL;DR
>Microservices applications are the most common and complex type of distributed application being built today...We are all now building distributed systems!
>
>— Christopher Meiklejohn[^cmeik]

[^cmeik]: Christopher Meiklejohn, Strangeloop 2022 [Resilient Microservices without the Chaos](https://www.youtube.com/watch?v=F32peAwCPlM)

Delivering innovative customer experiences today requires the real-time networked connection of people, process, data and things (devices)[^a16z].


But creating those connections has become shockingly complicated: as a systems architect and developer you have to cope with too many client libraries, cloud services and infrastructure components.

Why are we doing this? Because most libraries, services and infrastructure components implement different protocols. These protocols where designed as silos, covering a very specific application development requirement.

But do we really need them? Couldn't

The result in a complex technology solution prone to inefficiencies, delays and fatigue hindering the success of business initiatives.

Bondy is our contribution to solve the problem and it was born out of our own necessity. We have used Bondy in production for serveral years achieving a reduction in time-to-market



::: warning DRAFT

## An overwhelming accidental complexity

> A long habit of not thinking a thing wrong, gives it a superficial appearance of being right, and raises at first a formidable outcry in defence of custom.
>
>— Thomas Paine



The computer software industry has a tendency to add vertical solutions as silos and build layers over layers without taking things away[^cncf].

For example, new modern Remote Procedure Call (RPC) technologies like gRPC and new incarnations of the ubiquitous HTTP protocol still make a distinction between clients and servers. When the smart phones we have in our pockets are more powerful than the supercomputers of the 80s, those frameworks still treat the browser running on the them as dumb clients.

These complicates the implement of several use cases in which it would be desirable for the "server" to call the "client".

Fortunately, the advances in distributed computing over the last 10 years have given us a new horizon, one where we are able to treat our mobile devices as the system or record. I am referrying to peer-to-peer networking and local-first software[^mklepp].

But this will come at a cost.

Moreover, these technologies implement a single application comunication pattern e.g. point-to-point RPCs or Publish-Subscribe (PubSub). If your application, needs both communication patterns, you need to adopt, learn and use two different client libraries and infrastructure components. Moreover, some protocols are not web-native so if you want to integrate say PubSub on your web-based app you might need to resort to integrate also a cloud based solution, again this means yet another protocol/client dependency.

<!-- Frameworks pretend to solve this by adding yet more features, more adapters, more callbacks. Most of the time implemented using proprietary Software Development Kits (SDKs) in a specific programming language. This SDKs evolve over time and require those adapters to be rebuilt. Moreover sometimes those adapters have to be deployed within the infrastructure component, which complicates its maintenance, support and operating characteristics. -->

As a result, connecting people, process, data and things has become more and more complex.

The growing need to deliver innovative customer experiences in a hypersegmented and hypercompetitive market means developers have to deal with a surge in essential complexity[^fbrooks] new uses cases, new integrations, real-time user interactions.  The key implication is the **need to design and develop multi-platform, polyglot distributed systems**.

In order to deliver these systems developers need to integrate and ever increasing number of technologies (protocols, clients, dependencies, infrastructure components). This dramatically increments the accidental complexity[^fbrooks].

<ZoomImg src="/assets/accidental_complexity.png"/>

We desperately need to simplify and make it easier for developers to deliver these systems swiftly and at a lower cost.

> Where the big technology companies can cope with this complexity,


:::


## The need for a universal application communication protocol

* An aplication protocol (L7)
* Support for multiple (all) application communication patterns
* P2P programming model (nobody is dumb anymore)
* Extensible (without committee approvals)
* Web Native (no WASM)
* Transport agnostic
* Multiple serializations
* P2P network

## WAMP: The protocol that was ahead of its time

## WAMP: Revival and Beyond


[^cncf]: The Cloud Native Computing Foundation (CNCF), [Cloud Native Interactive Landscape](https://landscape.cncf.io) lists more than 450 technologies. Most of them added in the last 10 years.
[^mklepp]: Marin Kleppmann et al., [Local-First Software: Your Own Your Data, in spite of the Cloud](https://martin.kleppmann.com/papers/local-first.pdf)
[^fbrooks]: In [No Silver Bullet — Essence and Accident in Software Engineering](https://en.wikipedia.org/wiki/No_Silver_Bullet), Fred Brooks distinguishes between two different types of complexity: accidental complexity and essential complexity. Essential complexity is caused by the problem to be solved, and nothing can remove it. Accidental complexity relates to problems which engineers create and can fix; for example, the details of writing and optimizing assembly code or the delays caused by batch processing.
[^a16z]: Marc Andreessen, [Why Software is Eating the World](https://a16z.com/2011/08/20/why-software-is-eating-the-world)
