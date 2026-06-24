---
title: Check if you are breaking your admin rules in your GitHub repos
published: true
description: >-
  Use Tailpipe (a lightweight, open source tool) to analyze GitHug audit logs
  using familiar SQL syntax to identify overrides to branch protection rules
tags: []
canonical_url: >-
  https://dev.to/mattstratton/check-if-you-are-breaking-your-admin-rules-in-your-github-repos-467b
id: 2348487
cover_image: >-
  https://dev-to-uploads.s3.amazonaws.com/uploads/articles/bo03gjfc70kn2pv6kif8.png
---
[Branch protection rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) in GitHub are powerful! We can set rules that don't allow folks to commit directly to `main`, as well as enforce that PRs need to be reviewed and approved, and have required checks before merging.

However, often we allow admin folks on the repo to be able to bypass these restrictions (the infamous "Merge without waiting for requirements to be met (bypass rules)" checkbox), which can be useful - checks can get stuck, sometimes we do need to do an emergency fix, etc. 

It can be really helpful to easily track and report on when these protections are bypassed. I'll show you here how to use Tailpipe in combination with your [GitHub Audit Logs](https://docs.github.com/en/organizations/keeping-your-organization-secure/managing-security-settings-for-your-organization/reviewing-the-audit-log-for-your-organization#exporting-the-audit-log) to find out who has been sneaking past the rules!

In my example, I'll be querying from the audit logs for the [DevOpsDays GitHub org](https://github.com/devopsdays), since I'm an admin there and...maybe have broken my own rules a few times :)

## Getting started with Tailpipe

[Tailpipe](https://tailpipe.io) is a lightweight and open source tool which you can use to analyze all kinds of logs directly in your terminal, using familar SQL syntax. 

Here's how to install Tailpipe and the [GitHub plugin](https://hub.tailpipe.io/plugins/turbot/github):

### Install and Configure Tailpipe

If you use Homebrew, it's as simple as
 
```shell
brew install turbot/tap/tailpipe
```

otherwise, use the install script

```shell
sudo /bin/sh -c "$(curl -fsSL https://tailpipe.io/install/tailpipe.sh)"
```

Install the GitHub Tailpipe plugin

```shell
tailpipe plugin install github
```

Download your GitHub Audit Logs and save them to a directory, perhaps `/Users/USERNAME/github_audit_logs`

Once you've done this, we need to configure Tailpipe's table partition and data source. Create a file at `~/.tailpipe/config/github.tpc` with the following config (replace the path in the third line with the directory you saved the logs to)

```
partition "github_audit_log" "my_logs" {
  source "file"  {
    paths       = ["/Users/myuser/github_audit_logs"]
    file_layout = "%{DATA}.json.gz"
  }
}
```

Finally, let's collect the logs. One simple Tailpipe command slurps all the log data into our table:

```shell
tailpipe collect github_audit_log
```

## Run some queries

The awesome thing about Tailpipe is that it lets us search and filter our log data using SQL queries (another awesome thing is that this all happens locally, so you don't have to pay for some cloud service to analyze it, or ship your sensitive logs somewhere else). 

We can run our queries in a few ways - either run `tailpipe query` (for the interactive query shell) or you can save them as `.sql` files and run them using `tailpipe query <filename.sql>`.

### What options do we have?

If I want to see the columns available to me for my queries, when I'm in the query shell, I can use the `inspect` command, like so:

```shell
$ tailpipe query
> .inspect github_audit_log
Column                     Type
action                     varchar
actor                      varchar
actor_id                   bigint
actor_ip                   varchar
actor_location             json
additional_fields          json
business                   varchar
business_id                bigint
created_at                 timestamp
document_id                varchar
external_identity_name_id  varchar
external_identity_username varchar
hashed_token               varchar
operation_type             varchar
org                        varchar
org_id                     varchar
repo                       varchar
              timestamp
token_id                   bigint
token_scopes               varchar
tp_akas                    varchar[]
tp_date                    date
tp_destination_ip          varchar
tp_domains                 varchar[]
tp_emails                  varchar[]
tp_id                      varchar
tp_index                   varchar
tp_ingest_timestamp        timestamp
tp_ips                     varchar[]
tp_partition               varchar
tp_source_ip               varchar
tp_source_location         varchar
tp_source_name             varchar
tp_source_type             varchar
tp_table                   varchar
tp_tags                    varchar[]
tp_timestamp               timestamp
tp_usernames               varchar[]
user                       varchar
user_id                    bigint
```

## Simple query

For starters, let's find out all the times someone bypassed branch rules protection in general. If we run `tailpipe query` without arguments, it opens the interactive query shell:

```shell
$ tailpipe query
> select created_at, actor, repo, action from github_audit_log where action='protected_branch.policy_override' order by created_at desc
+---------------------+--------------+--------------------------------+----------------------------------+
| created_at          | actor        | repo                           | action                           |
+---------------------+--------------+--------------------------------+----------------------------------+
| 2025-03-20 19:59:15 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-20 13:44:00 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-20 13:14:51 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-19 19:41:08 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-19 19:37:01 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-18 18:22:41 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-18 17:23:08 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-17 22:44:35 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-13 15:31:54 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-10 14:54:54 | yvovandoorn  | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-05 18:54:00 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-05 17:25:21 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-04 17:16:41 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-03 23:37:29 | mattstratton | devopsdays/devopsdays-assets   | protected_branch.policy_override |
| 2025-03-02 23:13:30 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-27 15:45:55 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-25 23:27:24 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-22 02:47:13 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-17 11:20:34 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-14 23:09:25 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-12 09:10:46 | yvovandoorn  | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-11 19:26:17 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-10 16:59:19 | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-10 16:08:52 | phrawzty     | devopsdays/devopsdays-web      | protected_branch.policy_override |
(output truncated)
```

This is a good start; we can see that the most egregious abuser of the admin privilege is, well, me.

## Add another column to the query

Now let's find out where it happened. For this, we can add the `referrer` column to our query.

```shell
$ tailpipe query
> select created_at, additional_fields.referrer, actor, repo, action from github_audit_log where action='protected_branch.policy_override' order by created_at desc 
+---------------------+-------------------------------------------------------------------------------------------------+--------------+--------------------------------+----------------------------------+
| created_at          | referrer                                                                                        | actor        | repo                           | action                           |
+---------------------+-------------------------------------------------------------------------------------------------+--------------+--------------------------------+----------------------------------+
| 2025-03-20 19:59:15 | "https://github.com/devopsdays/devopsdays-web/pull/15001"                                       | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-20 13:44:00 | "https://github.com/devopsdays/devopsdays-web/edit/main/content/events/2025-chicago/program.md" | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-20 13:14:51 | "https://github.com/devopsdays/devopsdays-web/pull/14998"                                       | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-19 19:41:08 | "https://github.com/devopsdays/devopsdays-web/pull/14997"                                       | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-19 19:37:01 | "https://github.com/devopsdays/devopsdays-web/pull/14996"                                       | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-18 18:22:41 | <null>                                                                                          | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-18 17:23:08 | <null>                                                                                          | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-17 22:44:35 | "https://github.com/devopsdays/devopsdays-web/pull/14988"                                       | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-13 15:31:54 | "https://github.com/devopsdays/devopsdays-web/pull/14974"                                       | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-10 14:54:54 | "https://github.com/devopsdays/devopsdays-web/pull/14955"                                       | yvovandoorn  | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-05 18:54:00 | "https://github.com/devopsdays/devopsdays-web/edit/main/data/events/2025/chicago/main.yml"      | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-05 17:25:21 | <null>                                                                                          | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-04 17:16:41 | "https://github.com/devopsdays/devopsdays-web/pull/14939"                                       | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-03-03 23:37:29 | "https://github.com/devopsdays/devopsdays-assets/pull/226"                                      | mattstratton | devopsdays/devopsdays-assets   | protected_branch.policy_override |
| 2025-03-02 23:13:30 | "https://github.com/devopsdays/devopsdays-web/pull/14933"                                       | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-27 15:45:55 | <null>                                                                                          | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-25 23:27:24 | <null>                                                                                          | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-22 02:47:13 | <null>                                                                                          | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-17 11:20:34 | <null>                                                                                          | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-14 23:09:25 | "https://github.com/devopsdays/devopsdays-web/pull/14883"                                       | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-12 09:10:46 | <null>                                                                                          | yvovandoorn  | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-11 19:26:17 | "https://github.com/devopsdays/devopsdays-web/pull/14870"                                       | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-10 16:59:19 | <null>                                                                                          | mattstratton | devopsdays/devopsdays-web      | protected_branch.policy_override |
| 2025-02-10 16:08:52 | "https://github.com/devopsdays/devopsdays-web/pull/14858"                                       | phrawzty     | devopsdays/devopsdays-web      | protected_branch.policy_override |


(output truncated)
```
This shows us the pull requests that were overridden, but also if you look at the second record, it refers to a single file, which means it wasn't a PR...that was a yolo commit to main (made via the GitHub web interface)

## A more complicated query

Speaking of that... if we want to just filter based on yolo commit to main? This query works for that, but also uses some more complicated SQL in order to make the output more readable:

```sql
select 
  created_at, 
  actor, 
  repo,
  referrer 
from (
  select 
    created_at, 
    action, 
    additional_fields.overridden_codes, 
    additional_fields.referrer as referrer, 
    additional_fields.reasons, 
    action,
    repo,
    actor 
  from 
    github_audit_log 
  where 
    action = 'protected_branch.policy_override' 
    and CONTAINS(additional_fields.reasons,'Changes must be made through a pull request')
  order by 
    created_at desc
  ) 
as s
```
If we take that query and save it as `query.sql`, we can run `tailpipe` at the command line and use that file for the query:
```shell
$ tailpipe query query.sql
+---------------------+--------------+---------------------------+-------------------------------------------------------------------------------------------------+
| created_at          | actor        | repo                      | referrer                                                                                        |
+---------------------+--------------+---------------------------+-------------------------------------------------------------------------------------------------+
| 2025-03-20 13:44:00 | mattstratton | devopsdays/devopsdays-web | "https://github.com/devopsdays/devopsdays-web/edit/main/content/events/2025-chicago/program.md" |
| 2025-03-18 18:22:41 | mattstratton | devopsdays/devopsdays-web | <null>                                                                                          |
| 2025-03-05 18:54:00 | mattstratton | devopsdays/devopsdays-web | "https://github.com/devopsdays/devopsdays-web/edit/main/data/events/2025/chicago/main.yml"      |
| 2025-02-27 15:45:55 | mattstratton | devopsdays/devopsdays-web | <null>                                                                                          |
| 2025-02-10 16:59:19 | mattstratton | devopsdays/devopsdays-web | <null>                                                                                          |
| 2025-01-24 15:36:02 | mattstratton | devopsdays/devopsdays-cli | <null>                                                                                          |
| 2024-09-13 20:46:02 | mattstratton | devopsdays/devopsdays-web | <null>                                                                                          |
| 2024-08-29 11:33:06 | mattstratton | devopsdays/devopsdays-web | "https://github.com/devopsdays/devopsdays-web/delete/main/mattytest.txt"                        |
| 2024-08-28 13:59:20 | mattstratton | devopsdays/devopsdays-web | <null>                                                                                          |
+---------------------+--------------+---------------------------+-------------------------------------------------------------------------------------------------+
```

(The entries with "null" for the referrer mean that the commits were made directly to `main` outside of the web interface, i.e., I did a `git push origin main`)

## Conclusion

Being able to query and report on GitHub audit actions in a local, fast way (without having to upload our sensitive logs to another service) gives us a lot of flexibility to dig into actions take on our repos!
