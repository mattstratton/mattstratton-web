---
title: Why I'm Learning ROS 2 as a Database Person
published: true
description: >-
  There's no real story for storing and querying ROS 2 telemetry at fleet scale.
  I'm going to build one and document everything I get wrong along the way.
tags: ros2
canonical_url: 'https://dev.to/mattstratton/why-im-learning-ros-2-as-a-database-person-3cce'
id: 3597694
cover_image: >-
  https://dev-to-uploads.s3.amazonaws.com/uploads/articles/i1abng8j0w47hwi1z2x4.png
series: Learning ROS 2 as a Database Person
---

There's a moment that happens in every robotics company that makes it to production. The pilot worked. The robot does the thing. Now there are twenty on the floor, then fifty, then a fleet, and somebody asks: "What did the sensors look like on unit 17 during those three anomalies last quarter?"

That's when the data infrastructure question gets real. As robotics moves from lab to warehouse floor to factory line, that question is going to come up a lot more often. The default answers aren't really built for it.

I'm not a robotics engineer. Never built a robot. Never written a [ROS 2](https://docs.ros.org/en/jazzy/) node or had an argument about [MCAP](https://mcap.dev) vs. SQLite3 (though I'm about to). What I am is someone who's spent 20+ years watching what happens when storage decisions get made before the questions are fully understood. Log files are the classic version: great for appending, bad for answering "show me the error pattern across 200 servers from three weeks ago." The data exists. It's just not queryable. That's the shape of regret I'm talking about.

I work at [Tiger Data](https://tigerdata.com) doing developer relations for [TimescaleDB](https://github.com/timescale/timescaledb). Time-series data is literally my job. When I started looking at how ROS 2 handles recorded telemetry at scale, I saw something familiar: high-frequency sequential writes, stable append rates, a recording format optimized for replay rather than analysis, no real query story for "compare behavior across 200 runs without loading everything into memory."

Oof.

`rosbag2` is good at what it does. Record, replay, done. That's the right scope for it. If you've been running ROS 2 long enough to think about what happens *after* the bag file, you've probably felt the edge of that scope. The problem is that "done recording" is the beginning of a different problem when you're trying to understand what's happening across a fleet, over time, at scale. There's [an open feature request in the rosbag2 repo](https://github.com/ros2/rosbag2/issues/1739) that names TimescaleDB and InfluxDB by name as candidate options for exactly this. It's been open since July 2024. Zero comments.

The community noticed the gap. Nobody filled it.

So that's what I'm going to try to figure out, in public. I'm going to build a ROS 2 node that writes telemetry directly to TimescaleDB and actually query it. All of it in a [public GitHub repo](https://github.com/mattstratton/ros2-timescaledb-bridge), commit by commit, so the decisions are visible as they get made. Document everything that breaks. The database side I know. The ROS 2 side I'm learning from scratch, and I'll be honest about that difference in real time. And to be clear: I don't actually know what any of this looks like at fleet scale. That's not false modesty. That's the whole point.

What's coming next: getting the local environment set up ([TurtleBot3](https://emanual.robotis.com/docs/en/platform/turtlebot3/overview/) is basically the hello world of ROS 2 simulation: it's what the official tutorials use, it publishes the standard topics I care about, and [Gazebo](https://gazebosim.org) runs the whole thing without me needing actual hardware*) and a post on what `rosbag2` actually stores and why the format question matters once you're past replay. After that, the actual build: schema decisions, type mapping headaches, and a Grafana dashboard over live robot telemetry. The full tutorial comes last, once I've learned enough to actually teach it.

If you've ever wanted to weigh in on that [rosbag2 feature request](https://github.com/ros2/rosbag2/issues/1739), now's a good time. And if you're working on this problem (fleet telemetry pipelines, robot data at scale, the gap between recording and understanding), I want to hear what you're running into.

---

\* - that said, I am not opposed to asking my boss to buy me a robot
