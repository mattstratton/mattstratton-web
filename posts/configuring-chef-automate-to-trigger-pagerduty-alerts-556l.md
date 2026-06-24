---
title: Configuring Chef Automate to Trigger PagerDuty Alerts
published: true
description: >-
  Wouldn’t it be great if we could generate an incident when our systems fell
  out of compliance? By combining Chef Automate and PagerDuty, through simple
  webhooks, we can absolutely do this.
tags: devo
canonical_url: >-
  https://medium.com/@mattstratton/configuring-chef-automate-to-trigger-pagerduty-alerts-823a1fab9402
id: 14911
cover_image: 'https://thepracticaldev.s3.amazonaws.com/i/nu9w2mn75pccnkloaw8b.png'
---

![](https://cdn-images-1.medium.com/max/1024/1*eqMy_PLqsx_kHWQMUHg6BQ.png)

Wouldn’t it be great if we could generate an incident when our systems fell out of compliance? By combining [Chef Automate](https://www.chef.io/automate/) and [PagerDuty](https://www.pagerduty.com), through simple webhooks, we can absolutely do this.

### Prerequisites

I make the following assumptions:

1. You already have Chef Automate installed with at least one node configured to send Compliance information to Automate (if you need help configuring this, I recommend [this excellent post](https://blog.chef.io/2017/07/17/detect-correct-chef-automate-audit-cookbook/) by Nick Rycar).
2. You have a PagerDuty account.

### Create Service in PagerDuty for Chef Compliance

We begin by creating a service in PagerDuty. A “service” represents an application, component, or team — in this case, we consider Compliance as an overall state. Currently, Chef Automate doesn’t provide us the ability to filter on which nodes get reported, but in a future post, I will dig into further configuration in PagerDuty to separate these into different service. For now, we’ll consider all of Compliance across our fleet as something we care about as a whole.

To create a service, click on **Configuration | Services** from the PagerDuty website, and then **Add New Service**.

![](https://cdn-images-1.medium.com/max/1024/1*-Dl4_QtFs_lf4tBltEak7w.png)

![](https://cdn-images-1.medium.com/max/935/1*reKp2nPZIRRLQ7AN_qKe0w.png)

1. Name the service Chef Compliance.
2. Provide an optional description.
3. The integration type should be Custom Event Transformer.
4. Integration name should be Chef Automate Compliance Webhook
5. Configure the remaining settings as appropriate for your organization.

![](https://cdn-images-1.medium.com/max/767/1*aae4qI_PVUf0gauIItxVtA.png)

After you save this new service, you’ll see it listed. Click on the integration name( Chef Automate Compliance Webhook ) so we can configure it:

![](https://cdn-images-1.medium.com/max/931/1*xvR5HY4aaC2bVT14asJtOQ.png)

Click on **Edit Integration**

![](https://cdn-images-1.medium.com/max/1024/1*cJeu_q2m4sEec7nGH0GU0g.png)

Replace the JavaScript with the following:

```javascript
var webhook = PD.inputRequest.body;

var normalized_event = {
  event_type: PD.Trigger,
  incident_key: webhook.node_uuid,
  description: "InSpec found a critical control failure on "+webhook.node_name,
    "details": {
    "Number of failed critical tests": webhook.number_of_failed_critical_tests,
    "Total number of critical tests": webhook.number_of_critical_tests
  },
  client: "Chef Automate",
  client_url: "https://automate.mattstratton.io/viz/#/compliance/reporting/nodes/"+webhook.node_uuid
};

PD.emitGenericEvents([normalized_event]);
```

You will eventually want to disable the setting Debug Mode, but it’s okay to leave it on for testing. Also be sure to replace `automate.mattstratton.io` with the FQDN of your own Automate server!

![](https://cdn-images-1.medium.com/max/1024/1*xAMuYUJCGm3XTSpLGOFw2A.png)

### Configure the Chef Automate Notification

You will need the Integration URL from the Chef Automate Compliance Webhook integration. It should be something like `https://events.pagerduty.com/integration/XXXXXXXXXXXX/enqueue`

Open your Chef Automate console, and switch to the **Nodes** &nbsp;tab:

![](https://cdn-images-1.medium.com/max/1024/1*402wY5iKNiDaoAAHowTnGg.png)

Click on **Notifications | Create Notification** :

![](https://cdn-images-1.medium.com/max/637/1*-XIP0XJ6WwhzijUTT3fvQw.png)

We want to add a **Webhook** notification, so select that one.

![](https://cdn-images-1.medium.com/max/800/1*wt2RqFmib_oEaNovfG1fWg.png)

Choose InSpec scan failures, and paste in your integration URL. Call the notification PagerDuty InSpec Scan Failures, and click **Save.**

![](https://cdn-images-1.medium.com/max/800/1*HbPD3uShtJgnCwXwViAD4Q.png)

### Testing the Notification

Assuming that we have a node that will fail the configured compliance profile, all we have to do is run chef-client on that node, and we should see it come up in PagerDuty like this:

![](https://cdn-images-1.medium.com/max/1024/1*OlIce-p4aeMzhh4QYQYB1g.png)

Here’s what the generated incident looks like in PagerDuty:

![](https://cdn-images-1.medium.com/max/800/1*Zv66OiUcy0dO-vGMq73UJQ.png)

And to be even fancier, we can see it in the PagerDuty mobile&nbsp;app:

![](https://cdn-images-1.medium.com/max/1024/1*Bt1rm9UBaGC4Hiw6LTOhSQ.jpeg)

### Reporting on Chef Client Errors in PagerDuty

Similar to Compliance failures, we can also generate alerts and incidents on a failed chef-client run. It’s a very similar process:

1. Create a new service in PagerDuty, but this time, call it Chef Client&nbsp;.
2. Use the Custom Event Transformer just as before, but name it Chef Automate Chef Client Webhook (or something less verbose, if you prefer).
3. Use the following JavaScript for the integration:

```javascript
var webhook = PD.inputRequest.body;

var normalized_event = {
  event_type: PD.Trigger,
  incident_key: webhook.node_uuid,
  description: "Chef client failed on "+webhook.node_name+" with error: "+webhook.exception_message,
  details: webhook.exception_backtrace,
  client: "Chef Automate",
  client_url: webhook.automate_failure_url
};

PD.emitGenericEvents([normalized_event]);
```

In Automate, you will create a notification similar to the Compliance one, but instead of reporting on InSpec failures, select the option for Chef client run failures

![](https://cdn-images-1.medium.com/max/512/1*uCyL3Xe5CQSWXSuxwhk8sw.png)

The reporting in PagerDuty is slightly different for this one — it will give the information on the error from chef-client, as well as the backtrace:

![](https://cdn-images-1.medium.com/max/923/1*25M6kPdAuHEVHl1QvXLpVg.png)

### In Summary

This is a pretty basic integration, but hopefully, it illustrates how easy it is to tie these two together. In a future post, I’ll dig into methods for sending specific Compliance failures to particular teams. Let me know what questions I can answer for you!
