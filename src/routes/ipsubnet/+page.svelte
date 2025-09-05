<script lang="ts">
  import IpSubnetBuilder from "$lib/components/IpSubnetBuilder.svelte";
  import IpSubnetParser from "$lib/components/IpSubnetParser.svelte";
  import Card from "$lib/ui/Card.svelte";
  import SectionLabel from "$lib/ui/SectionLabel.svelte";
</script>

<svelte:head>
  <title>IP Subnet: Builder & Parser</title>
  <meta
    name="description"
    content="Build and analyze IPv4 subnets. Enter IP and netmask (CIDR or dotted) to get network, broadcast, usable range, host counts, class, and flags."
  />
</svelte:head>

<div class="space-y-5">
  <IpSubnetBuilder />
  <IpSubnetParser />

  <SectionLabel>Help</SectionLabel>
  <section id="help">
    <Card>
      <div class="space-y-3 text-sm text-slate-300">
        <p>
          This tool works with IPv4 addresses and accepts subnet masks in CIDR (e.g. /24) or dotted
          decimal (e.g. 255.255.255.0) format. It computes the network address, broadcast address,
          first/last usable host, total and usable host counts, netmask, wildcard, IP class, and
          useful flags (private, loopback, link-local, multicast, reserved).
        </p>
        <ul class="list-disc pl-5">
          <li>
            /31 and /32 behave specially: usable host count covers point-to-point (/31) and single
            host (/32) scenarios.
          </li>
          <li>
            The "Suggest" button in the Builder uses your hosts-needed input to infer the minimal
            prefix that fits them.
          </li>
          <li>
            Private ranges (RFC1918): 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. Link-local:
            169.254.0.0/16. Loopback: 127.0.0.0/8. Multicast: 224.0.0.0/4.
          </li>
        </ul>
      </div>
    </Card>
  </section>
</div>
