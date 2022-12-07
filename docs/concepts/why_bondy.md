---
draft: false
---
# Why Bondy
Learn about the need for a unified application networking platform for distributed application development.


## TL;DR
>Microservices applications are the most common and complex type of distributed application being built today...We are all now building distributed systems!
>
>— Christopher Meiklejohn[^cmeik]

[^cmeik]: Christopher Meiklejohn, Strangeloop 2022 [Resilient Microservices without the Chaos](https://www.youtube.com/watch?v=F32peAwCPlM)

Delivering innovative customer experiences today requires the real-time networked connection of people, process, data and things (devices)[^cisco-ioe].

[^cisco-ioe]: [The Internet of Everything](https://www.cisco.com/c/dam/en_us/about/business-insights/docs/ioe-value-at-stake-public-sector-analysis-faq.pdf)

But creating those connections has become shockingly complicated due to the sheer number of infrastructure components, associated protocols, APIs and client libraries involved in most modern application development[^ogrady].

[^ogrady]: Stephen O'Grady, [The Developer Experience Gap](https://redmonk.com/sogrady/2020/10/06/developer-experience-gap/)

If you are using a microservices architectural style or if you are integrating multiple different customer/user touchpoints across Web, Mobile (and possibly IoT devices) you are developing a distributed application.

Distributed applications are very hard to design, develop and maintain. They require multiple application communication patterns such as Remote Procedure Call (RPC) for point-to-point synchronous request-response and Publish/Subscribe for many-to-many asynchronous communications. Unfortunately, this is where things get really complicated, because typically each pattern requires a separate frameworks and infrastructure component.

<!-- But should they be that difficult? Aren't we shooting ourselves in the foot by -->

<!-- The industry's tendency to build layers over the existing layers without retiring the ones below and most importantly, the tendency to solve specific problems with vertical solutions, creating technology silos is dramatically increasing fragmentation of the technology landscape.

> The fragmentation means that the fundamental activity in building a distributed application has now become **integration**. -->

The tools that we were using to integrate the 3-tier application monoliths of a not that distant past are the same we pretent to use to integrate 10s, 100s and in some cases even 1000s of microservices that resulted from the monolith decomposition. The decomposition allowed us to scale the social aspects of development, enabling us to tackle the increasing number of requirements (essential complexity) but due to the tools we are using we have now created a massive wave of accidental complexity.

As a result, developers have to cope with too many protocols, driving the number of client libraries, cloud services and infrastructure components.

Why are we doing this? Because most protocols where designed as silos, covering a very specific application use case or requirement.

But do we really need them?

The result in a complex technology solution prone to inefficiencies, delays and fatigue hindering the success of business initiatives.

Bondy is our contribution to solve the problem and it was born out of our own necessity. We have used Bondy in production for serveral years achieving a reduction in time-to-market.

<!--
## An overwhelming accidental complexity

> A long habit of not thinking a thing wrong, gives it a superficial appearance of being right, and raises at first a formidable outcry in defence of custom.
>
>— Thomas Paine



The computer software industry has a tendency to add vertical solutions as silos and build layers over layers without taking things away[^cncf].

[^cncf]: The Cloud Native Computing Foundation (CNCF), [Cloud Native Interactive Landscape](https://landscape.cncf.io) lists more than 450 technologies. Most of them added in the last 10 years.

For example, new modern Remote Procedure Call (RPC) technologies like gRPC and new incarnations of the ubiquitous HTTP protocol still make a distinction between clients and servers. Moreover when smartphones we have in our pockets are more powerful than the supercomputers of the 80s, HTTP still treats the browser running on the them as dumb clients.

These complicates the implementation of several use cases in which it would be desirable for the "server" to call the "client" or a "client" to call "client".

Fortunately, the advances in distributed computing over the last 10 years have given us a new horizon, one where we are able to treat our mobile devices as the system or record. I am referrying to peer-to-peer networking and local-first software[^mklepp].

[^mklepp]: Martin Kleppmann et al., [Local-First Software: Your Own Your Data, in spite of the Cloud](https://martin.kleppmann.com/papers/local-first.pdf)

But this will come at an additional cost: new protocols, APIs and libraries we need to learn and depend on.

Moreover, these technologies implement a single application comunication pattern e.g. point-to-point RPCs or Publish-Subscribe (PubSub). If your application, needs both communication patterns, you need to adopt, learn and use two different client libraries and infrastructure components. Moreover, some protocols are not web-native so if you want to integrate say PubSub on your web-based app you might need to resort to integrate also a cloud based solution, again this means yet another protocol/client dependency. -->

<!-- Frameworks pretend to solve this by adding yet more features, more adapters, more callbacks. Most of the time implemented using proprietary Software Development Kits (SDKs) in a specific programming language. This SDKs evolve over time and require those adapters to be rebuilt. Moreover sometimes those adapters have to be deployed within the infrastructure component, which complicates its maintenance, support and operating characteristics. -->
<!--
As a result, connecting people, process, data and things has become more and more complex.

The growing need to deliver innovative customer experiences in a hypersegmented and hypercompetitive market means developers have to deal with a surge in essential complexity[^fbrooks] new uses cases, new integrations, real-time user interactions.  The key implication is the **need to design and develop multi-platform, polyglot distributed systems**.

In order to deliver these systems developers need to integrate and ever increasing number of technologies (protocols, clients, dependencies, infrastructure components). This dramatically increments the accidental complexity[^fbrooks].

[^fbrooks]: In [No Silver Bullet — Essence and Accident in Software Engineering](https://en.wikipedia.org/wiki/No_Silver_Bullet), Fred Brooks distinguishes between two different types of complexity: accidental complexity and essential complexity. Essential complexity is caused by the problem to be solved, and nothing can remove it. Accidental complexity relates to problems which engineers create and can fix; for example, the details of writing and optimizing assembly code or the delays caused by batch processing. -->

<!-- <ZoomImg src="/assets/accidental_complexity.png"/>

We desperately need to simplify and make it easier for developers to deliver these systems swiftly and at a lower cost.

> Where the big technology companies can cope with this complexity,

 -->
<!--
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
TBD

## Bondy: WAMP Revival and Beyond
TBD -->



