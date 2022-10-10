# Why Bondy
> Bondy is an open source application networking platform that connects all elements of a distributed application, from web and mobile apps to IoT devices and backend services, allowing everything to talk using one single, simple protocol.{.definition}

## TL;DR
Delivering innovative customer experiences today requires the real-time **networked connection of people, process, data and things (devices)**. Advances in technology so far have facilitated some of the tasks involved, but the overall process has become shockingly complicated, putting projects at risk.

This results in a complex technology solution prone to inefficiencies, delays and fatigue hindering the success of business initiatives.

Bondy is our contribution to solve the problem and it was born out of our own necessity. Bondy is an easy to use platform that allows any software talk to any other software, anywhere, in any programming language, securely and reliably, using multiple communication patterns and requiring a **single unifying protocol** and a **single infrastructure component**.

::: warning DRAFT

## An overwhelming accidental complexity

The computer software industry has a tendency to add vertical solutions as silos and build layers over layers without taking things away[^1].

For example, new modern Remote Procedure Call (RPC) technologies like gRPC and new incarnations of the ubiquitous HTTP protocol still make a distinction between clients and servers. When the smart phones we have in our pockets are more powerful than the supercomputers of the 80s, those frameworks still treat the browser running on the them as dumb clients.

These complicates the implement of several use cases in which it would be desirable for the "server" to call the "client".

Fortunately, the advances in distributed computing over the last 10 years have given us a new horizon, one where we are able to treat our mobile devices as the system or record. I am referrying to peer-to-peer networking and local-first software[^2].

But this will come at a cost.

Moreover, these technologies implement a single application comunication pattern e.g. point-to-point RPCs or Publish-Subscribe (PubSub). If your application, needs both communication patterns, you need to adopt, learn and use two different client libraries and infrastructure components. Moreover, some protocols are not web-native so if you want to integrate say PubSub on your web-based app you might need to resort to integrate also a cloud based solution, again this means yet another protocol/client dependency.

<!-- Frameworks pretend to solve this by adding yet more features, more adapters, more callbacks. Most of the time implemented using proprietary Software Development Kits (SDKs) in a specific programming language. This SDKs evolve over time and require those adapters to be rebuilt. Moreover sometimes those adapters have to be deployed within the infrastructure component, which complicates its maintenance, support and operating characteristics. -->

As a result, connecting people, process, data and things has become more and more complex.

The growing need to deliver innovative customer experiences in a hypersegmented and hypercompetitive market means developers have to deal with a surge in essential complexity[^3] new uses cases, new integrations, real-time user interactions.  The key implication is the **need to design and develop multi-platform, polyglot distributed systems**.

In order to deliver these systems developers need to integrate and ever increasing number of technologies (protocols, clients, dependencies, infrastructure components). This dramatically increments the accidental complexity[^2].

<ZoomImg src="/assets/accidental_complexity.png"/>

We desperately need to simplify and make it easier for developers to deliver these systems swiftly and at a lower cost.

> Where the big technology companies can cope with this complexity,



## The need for a universal application communication protocol


[^1]: The [Cloud Native Computing Foundation (CNCF) [Cloud Native Interactive Landscape](https://landscape.cncf.io) lists more than 450 technologies. Most of them added in the last 10 years.
[^2]: [Local-First Software: Your Own Your Data, in spite of the Cloud](https://martin.kleppmann.com/papers/local-first.pdf)
[^3]: In [No Silver Bullet — Essence and Accident in Software Engineering](https://en.wikipedia.org/wiki/No_Silver_Bullet), Fred Brooks distinguishes between two different types of complexity: accidental complexity and essential complexity. Essential complexity is caused by the problem to be solved, and nothing can remove it. Accidental complexity relates to problems which engineers create and can fix; for example, the details of writing and optimizing assembly code or the delays caused by batch processing.
:::