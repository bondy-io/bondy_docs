---
related:
    - text: Install using Docker
      type: Guide
      link: /guides/install/docker
      description: The Docker image this guide runs inside Kubernetes.
    - text: Running a Cluster
      type: Guide
      link: /guides/deployment/running_a_cluster
      description: DNS-based peer discovery, the mechanism a headless Service enables here.
    - text: Cluster Configuration Reference
      type: Reference
      link: /reference/configuration/cluster
      description: Every cluster.* and cluster.peer_discovery.* key.
---
# Install using Kubernetes

Bondy doesn't ship an official Helm chart or Operator. Running it on Kubernetes means deploying the same [Docker image](/guides/install/docker) used anywhere else, as a `StatefulSet` behind a headless `Service` — the standard pattern for clustering an Erlang/BEAM application on Kubernetes, since a headless Service's DNS name resolves directly to every ready pod's IP, which is exactly what Bondy's [DNS-based peer discovery](/guides/deployment/running_a_cluster) needs.

**Prerequisites:** a container registry reachable from your cluster with the `leapsight/bondy` image (or your own build — see [Install using Docker](/guides/install/docker)); your `bondy.conf` and `security.config.json` prepared as a `ConfigMap`/`Secret`.

## Steps

### 1. Create a headless Service

A headless Service (`clusterIP: None`) gives each pod a stable, individually resolvable DNS name — `<pod>.<service>.<namespace>.svc.cluster.local` — and its bare service name resolves to an A record per ready pod, which is what DNS-based peer discovery queries.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: bondy-peers
spec:
  clusterIP: None
  selector:
    app: bondy
  ports:
    - name: peer
      port: 18086
```

### 2. Deploy Bondy as a StatefulSet

A `StatefulSet` (rather than a `Deployment`) gives each pod a stable identity across restarts, matching the stable Erlang nodename Partisan expects from a cluster member.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: bondy
spec:
  serviceName: bondy-peers
  replicas: 3
  selector:
    matchLabels:
      app: bondy
  template:
    metadata:
      labels:
        app: bondy
    spec:
      containers:
        - name: bondy
          image: leapsight/bondy:latest
          env:
            - name: BONDY_ERL_NODENAME
              value: "$(POD_NAME).bondy-peers.$(POD_NAMESPACE).svc.cluster.local"
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            - name: BONDY_ERL_DISTRIBUTED_COOKIE
              valueFrom:
                secretKeyRef:
                  name: bondy-secrets
                  key: distributed-cookie
          ports:
            - containerPort: 18080 # WAMP WebSocket / HTTP API Gateway
            - containerPort: 18081 # Admin API
            - containerPort: 18082 # WAMP Raw Socket TCP
            - containerPort: 18086 # Cluster peer
          volumeMounts:
            - name: config
              mountPath: /bondy/etc
            - name: data
              mountPath: /bondy/data
      volumes:
        - name: config
          configMap:
            name: bondy-config
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

`BONDY_ERL_NODENAME` resolves to the pod's own stable DNS name (Kubernetes doesn't expand `$(POD_NAME)`-style references inside an env var's own value the way this snippet implies — build the value with an init container or entrypoint script that reads `$HOSTNAME` and the Service's domain instead; the shape above is illustrative of what the *value* needs to look like, not a literally copy-pasteable Kubernetes env substitution).

### 3. Configure DNS-based peer discovery

In the `bondy.conf` you put in the `bondy-config` ConfigMap, point discovery at the headless Service's bare name — every ready pod's IP resolves from it:

```text
cluster.peer_discovery.enabled = on
cluster.peer_discovery.automatic_join = on
cluster.peer_discovery.type = dns
cluster.peer_discovery.config.record_type = a
cluster.peer_discovery.config.query = bondy-peers.default.svc.cluster.local
cluster.peer_discovery.config.node_basename = bondy
```

See [Running a Cluster](/guides/deployment/running_a_cluster) for the full peer-discovery walkthrough and [Cluster Configuration Reference](/reference/configuration/cluster) for every key.

### 4. Secure the peer plane

Bondy refuses to start with peer discovery enabled unless the peer plane is TLS-secured or the risk is explicitly acknowledged. The source tree's [`deployment/cluster-ca-bootstrap.sh`](https://github.com/bondy-io/bondy/blob/develop/deployment/cluster-ca-bootstrap.sh) script bootstraps a private CA and issues one cert per node hostname — run it once against your StatefulSet's predictable pod hostnames, and mount the resulting per-pod cert, key, and shared CA cert into each pod alongside `bondy.conf`.

## Result

A `StatefulSet` of Bondy pods, each with a stable identity, discovering and joining each other automatically through the headless Service's DNS, forming one cluster the same way any other DNS-discovered deployment does.

## See also

- [Install using Docker](/guides/install/docker) — the image and ports this guide builds on.
- [Running a Cluster](/guides/deployment/running_a_cluster) — DNS-based peer discovery in depth.
- [Cluster Configuration Reference](/reference/configuration/cluster) — every `cluster.*` key, including TLS.
