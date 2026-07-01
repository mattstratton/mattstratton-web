---
title: The Five Love Languages of DevOps
published: true
description: 'When we are working to bring about cultural change in our organization, it’s essential for us to understand that not everyone speaks the same “language of DevOps as we do.'
tags: long
canonical_url: 'https://medium.com/@mattstratton/the-five-love-languages-of-devops-77606263c910'
id: 11211
date: '2017-10-31T18:35:20Z'
---

_Based upon a talk I have given at several&nbsp;events._

When we are working to bring about cultural change in our organization, it’s essential for us to understand that not everyone speaks the same “language of DevOps as we do. The CFO has different drivers and communication style than your friend in the QA department, who is still different than the DBA in that remote&nbsp;office.

Before getting into the details on this approach, let’s talk a little bit about what “DevOps actually is. I went to Twitter and asked folks to let me know what they thought DevOps was&nbsp;NOT:

![](https://cdn-images-1.medium.com/max/1024/1*kWFw5WizDHJq-H-bYWW1iw.png)<figcaption>Yes, I quoted myself. Come atÂ me.</figcaption>

Jokes are easy, but you probably see a theme. Often times, we think that DevOps means “automation”. Or maybe DevOps means “using Jenkins”. It’s so very much more than&nbsp;that.

### Chef Style&nbsp;DevOps

![](https://cdn-images-1.medium.com/max/600/1*PmHXL7gHHKlDMQr7Cj_qQQ.gif)<figcaption>Chef CEO Barry Crist and CTO Adam Jacob keeping it real, devops-style</figcaption>

[Adam Jacob](https://medium.com/@adamhjk) gave a great talk at ChefConf 2015 called [Chef Style DevOps Kungfu](https://www.youtube.com/watch?v=_DEToXsgrPc&feature=youtu.be). I think that the definition of DevOps from that talk is a well-phrased one:

> A CULTURAL AND PROFESSIONAL MOVEMENT, FOCUSED ON HOW WE BUILD AND OPERATE HIGH VELOCITY ORGANIZATIONS, BORN FROM THE EXPERIENCES OF ITS PRACTITIONERS.

If we deconstruct this, we find that it is made up three major&nbsp;pieces:

**A cultural and professional movement…**  
Remember, that DevOps is not just about technology. It’s about how we work (aka “culture”). But it’s a professional movement as wellâ€Š–â€Šagain, it’s about how we&nbsp;_work_.

**…build and operate high velocity organizations…**  
Notice that none of this is about how we ship software or build servers. It’s about building and running an _organization_. Organizations are made up of people. Remember that part. It _will_ be on the&nbsp;final.

**…born from the experiences of its practitioners.**  
This comes from the real world. Folks who have successfully created and maintained these high-velocity organizations are the ones who have helped shape these practices. This isn’t theory. This isn’t a library given to you by a vendor. Boots on the ground, so to speak, have created these practices.

### The Five Love Languages

![](https://cdn-images-1.medium.com/max/363/1*Yjj-kxs83Yw8EAeuklIbcw.png)

I’m not going to lie. I haven’t really read this entire book. But I am pretty sure that it’s like most business books, which means it can be summarized nicely in a blog post or a TED talk. Gary Chapman’s general conceit is there are five “love languages”, and an individual prefers one over the other five. The challenge comes in when our partner “speaks a different love language.

The five languages are:

1. Words of Affirmation
2. Acts of&nbsp;Service
3. Receiving Gifts
4. Quality Time
5. Physical Touch

For example, if my “love language is “Acts of Service”, but my partner’s is “Words of Affirmation”, I will do all sorts of nice things for her, but if I don’t show it in words, she’ll not see it as the act of love that I think it is. And since we can’t expect people to come to us, we have to go to&nbsp;them.

### What does this have to do with shipping software?

![](https://cdn-images-1.medium.com/max/260/1*BhnSZwcx5dr3mXnmVCQZag.gif)

Trust me. It’s going to be fine. This analogy totally&nbsp;works.

For some backgroundâ€Š–â€Šafter the first US based Devopsdays in Mountainview 2010, Damon Edwards and John Willis coined the acronym **CAMS** , which stands for Culture, Automation, Measurement and Sharing. [Jez Humble](https://www.twitter.com/jezhumble) later added an L, standing for Lean, to form&nbsp;CALMS.

There are several different models/definitions of DevOps, but for purposes of this discussion, I’m going to use **CALMS** to specify different focus areas on what DevOps can&nbsp;be.

### Culture

A lot of people say that culture doesn’t matter. A few years ago, for a hot second there was a movement around “Enterprise DevOps which espoused the idea that in an enterprise, the “culture parts were unnecessary (one person notoriously said “culture is for yogurt”). [J. Paul Reed](https://twitter.com/jpaulreed) has talked about that it’s not important to change your culture, but mostly to ensure that your culture is consistent.

> “You can’t directly change culture. But you can change behavior, and behavior becomes culture  
> –Lloyd Taylor, VP Infrastructure, Ngmoco

People work by incentives. If you want to change behavior, one of the best ways is to look at how the folks in your organization are rewarded. You incentivize for the behavior you want, and then that behavior drives culture…which drives further behavior! It’s turtles all the way&nbsp;down.

### Automation

![](https://cdn-images-1.medium.com/max/404/1*r_-_ZWam5n6mQn0o121-6g.png)<figcaption><a href="https://xkcd.com/1319/">https://xkcd.com/1319/</a></figcaption>

If you meet someone whose title is “DevOps Engineer”, chances are pretty good that “automation is their main jam. This includes tools like [Chef](https://www.chef.io), [Puppet](https://puppet.com/), or [other configuration management tools](https://www.ansible.com/)…automated testing frameworks, and yes, technically a bash script in a FOR loop is automation. Of a sort. What it boils down to is thisâ€Š–â€Šmanual steps when human brains aren’t needed are a problem. Automate your process up to the steps when human smarts are needed to make a decision or provide direction.

> “Asking experts to do boring and repetitive, and yet technically demanding tasks is the most certain way of ensuring human error, short of sleep deprivation, or inebriation.  
> - _Continuous Delivery_, Jez Humble and David&nbsp;Farley

### Lean Thinking

Lean Thinking is a business methodology which attempts to provide a different method to reason about organizing human activities to deliver greater benefits to society and value to individuals, all while eliminating waste. [James P. Womack](https://www.lean.org/WhoWeAre/LeanPerson.cfm?LeanPersonId=1) and [Daniel T. Jones](https://www.lean.org/WhoWeAre/LeanPerson.cfm?LeanPersonId=2) coined the term “Lean Thinking to describe the essence of their study of the [Toyota Production System](https://en.wikipedia.org/wiki/Toyota_Production_System). Lean thinking is a new way of approaching any activity and seeing the waste inadvertently generated by the organization of the&nbsp;process.

### Measurement

How do we know if we have succeeded if we don’t collect metrics? As the old saw goes, “that which is not measured didn’t&nbsp;happen.”

It’s crucial to start measurement before you _begin_ a transition. You can’t go back in time and collect information you didn’t know you wanted at the time. Disk space is cheap. Collect as much information as you&nbsp;can.

Set your success criteria at the outset. Start with no more than three success criteria. And they must be measurableâ€Š–â€Šand actually measured! If your criteria for success is “ship better software, you damn well better know what “better means. And here’s a clueâ€Š–â€Šput a number on&nbsp;it.

### Sharing

This is all about transparency. The more information that someone has, the better informed they are to make smart decisions.

The amount of information in an organization that is truly “need to know is much smaller than you think. Generally speaking, when someone believes that information needs to stay with them or their team only, it comes from a place of defensivenessâ€Š–â€Šthey are playing defense and trying to protect their value. That ain’t&nbsp;DevOps.

It’s additionally important to share the _why_ of decisions, as much as possible. Mandates don’t work very well. In any organization, individuals can be classified as either “compliant or “committed”. The compliant person is the one who follows the rules, but only out of fear or duty –he doesn’t truly “buy in to the underlying principles.

A “committed person truly understands the value of the business processes, standards, and ways of doing work. She has synthesized the connection between the process and the outcome, and by having this understanding, she can be more flexible when needing to make crucial decisions. As you have more commitment, the success of your organization will grow exponentially.

Finally, a sharing culture is required to have a culture of trust. Trust between teams, individuals, and business units can’t happen without transparency. Think about your own personal relationshipsâ€Š–â€Šif you are not transparent with your partner, can he truly trust you? Probably not. Guess what? This is true at the office as well. If we want to develop a culture of blamelessness, trust is at the&nbsp;core.

### Each of these is a DevOps Love&nbsp;Language

As you consider the five concepts above, I guarantee that some resonated with you more than others. Perhaps you totally dig on automation, and can immediately perceive the value that implementing Selenium tests in your delivery cycle would bring. Other readers are drawn towards the idea of a measurement-friendly organization. Just like “love languages.”

> “If you find yourself thinking â€˜this is crystal clear to me, why aren’t they seeing it?’, that’s more about _you_ than it is about _them_.  
> –Bill Joy, [_Arrested DevOps_ Episode&nbsp;33](https://www.arresteddevops.com/33)

Just like I mentioned above with the love languages, it’s more important for us to learn to talk to others, than to expect them to come speak our language. We have control over our own actions, and nobody&nbsp;else’s.

It’s not enough to get someone to “do it”â€Š–â€Šthey need to see the value in their own language. That’s how you get committed people. When they understand the value based upon their own personal lens to the&nbsp;world.

### DevOps and Communication Styles

So how can we figure out someone’s DevOps love language? I find that using a tool like the DiSC assessment can be very helpful. DiSC is similar to Meyers Briggs, but much more focused on communication styles, which makes it easier to assess someone informally (but you could be&nbsp;wrong!)

![](https://cdn-images-1.medium.com/max/587/1*tcpfeTjp4BZuioTl8mwnRA.png)<figcaption><a href="http://www.discoveryreport.com/DiscoveryReportForm_quick.php">http://www.discoveryreport.com/DiscoveryReportForm_quick.php</a></figcaption>

### Direct

**Lean/Measurement**

Someone who is more in the Direct quadrant of DiSC (also sometimes called “dominant”, but I prefer “direct”) is most likely going to respond favorably to the ideas of Lean and Measurement. She is results-driven. She wants to see how the change helps move the ball forward and is almost more likely to be influenced by experimentation.

Preaching culture or automation won’t necessarily resonate with her. She cares less about the “how than she does about the result and the&nbsp;outcome.

#### Influencing

**Culture/Sharing**

An “influencing type will respond to the concepts of culture and sharing. He likes consensus and enjoys collaboration. The results-oriented portions (especially automation) won’t have as much of an impact on&nbsp;him.

### Steadiness

**Automation/Measurement**

Steadiness folks like stability. They want to be sure about change and be comfortable with it. Automation helps them feel safe, and measurement assists in understanding that things didn’t _really_ get messed up that badly. Lean concepts can make an S feel very uncomfortable.

### Conscientious

**Sharing/Measurement**

Someone who is in the conscientious quadrant of DiSC will respond best to sharing and measurementâ€Š–â€Šthey LOVE data. They want to measure thirty times and cut once. The experimentation of Lean might scare them. Culture has a much lower impact. Automation is an influence, but not as high as Sharing and Measurement.

### Assess the&nbsp;drivers

Often times we have conflicting incentives. Software engineers are incentivized to ship features quickly. Ops are measured on&nbsp;uptime.

These may actually not be at odds. Ultimately, our driver should be to move our business forward, at a macro level, but we can still have our own individual incentives for our roles. Changing these isn’t always&nbsp;right.

Understanding what appears to be a conflict may actually help. Shipping changes at a higher velocity can actually _increase_ the stability of a system because small batch changes are more stable. Shipping more frequently actually helps both dev _and_&nbsp;ops.

Similarly, caring about uptime and stability can enable software engineers to ship more features, as they are not caught up in troubleshooting and have more resources available from the ops&nbsp;teams.

### Be a salesperson

I know, I know. We all got into technology because we didn’t want to have to deal with people. The hard truth is that if you want to be a change agent, you are going to have to learn how to&nbsp;sell.

We can learn from [_The Challenger Sale_](https://www.amazon.com/Challenger-Sale-Control-Customer-Conversation/dp/1591844355) (read the whole book if you want, but [this blog post](https://www.heinzmarketing.com/2013/01/the-challenger-sale-in-less-than-10-minutes/) will get you where you need to go). Consider&nbsp;this:

> “[Challengers have] a deep understanding of the customer’s business and use that understanding to push the customer’s thinking and teach them something new about how their company can compete more effectively.”

If you’re not comfortable being a salesperson, find a buddy who is. You want this change to happen, right? You’re going to have to do some&nbsp;work.

### Talk their&nbsp;language

The key is to look at your key influencer as your _client_ instead of your _boss_ for the purpose of this&nbsp;project.

If your client (who happens to be your boss) shoots down your ideas and offers a counter plan, you have to be ready to channel some boldness and stand firm in your beliefs. Instead of arguing back and forth, or worse, completely backing down because of her position above you in the company, try saying something like “I see what you’re saying, but if we do it your way, this is what is going to happen”, and then lay out how their plan is&nbsp;flawed.

### The best change agents are those who don’t see people as something they “have to deal&nbsp;with”

They’re authentically interested in them, and enjoy the pursuit of the how of change more than the change&nbsp;itself.

Bring people along for the ride! Don’t dictate; let the influencers and stakeholders take an active part in the change. Find out where their pain points are. Get their opinions. Make your tent&nbsp;big.

Organizational change isn’t easy. But the more effort you put into approaching your stakeholders and influencers from a place of empathy and active listening, the greater your chances of&nbsp;success.

What has been your experience in effecting change in your organization? What has worked? What hasn’t? Let me know in the comments!
