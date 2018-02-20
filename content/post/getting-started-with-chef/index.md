+++
date = "2017-01-20T13:35:31-06:00"
title = "Getting Started with Chef"
description = "Chef is super cool. The point of this post is to walk you through the basics of getting started solving a problem with Chef."
image = "/post/getting-started-with-chef/banner.jpg"

+++

Chef is super cool. The point of this post is to walk you through the basics of getting started solving a problem with Chef.

The first thing we want to do is create a cookbook. A cookbook is, well, we don't care yet. Trust me, we'll get to it.

## Installing tools

You need a few things on your local machine. To go through this, please install the following stuff:

- [ChefDK](https://downloads.chef.io/chefdk)
- [Vagrant](https://www.vagrantup.com/)
- [VirtualBox](https://www.virtualbox.org/wiki/Downloads)

## Creating our cookbook

Open a terminal, and change to a directory where you want to do your work.

Inside the terminal, run this command `chef generate cookbook my_awesome_cookbook`

The output should be like this:

```
 ~/src/ chef generate cookbook my_awesome_cookbook
Generating cookbook my_awesome_cookbook
- Ensuring correct cookbook file content
- Committing cookbook files to git
- Ensuring delivery configuration
- Ensuring correct delivery build cookbook content
- Adding delivery configuration to feature branch
- Adding build cookbook to feature branch
- Merging delivery content feature branch to master

Your cookbook is ready. Type `cd my_awesome_cookbook` to enter it.

There are several commands you can run to get started locally developing and testing your cookbook.
Type `delivery local --help` to see a full list.

Why not start by writing a test? Tests for the default recipe are stored at:

test/smoke/default/default_test.rb

If you'd prefer to dive right in, the default recipe can be found at:

recipes/default.rb
```

## Setting up our cookbook to only test Ubuntu

You'll need to modify a file for testing purposes to use Ubuntu instead of both Ubuntu and CentOS. Open the `.kitchen.yml` file in your text editor, and remove the following line:

```
  - name: centos-7.2
```
Remember, YAML cares a lot about whitespace, so be careful.

## Checking out our test instance

We want to solve a problem with Chef. The problem we want to solve is installing Apache. So first, we want to fire up our test instance and see if the package `apache2` is installed.

Run the command `delivery local provision` from within the `my_awesome_cookbook` directory to create the virtual instance we'll be using. You should see output like this:

```
 ~/src/my_awesome_cookbook/ [master*] delivery local provision
Chef Delivery
Running Provision Phase
-----> Starting Kitchen (v1.14.2)
-----> Creating <default-ubuntu-1604>...
       Bringing machine 'default' up with 'virtualbox' provider...
       ==> default: Importing base box 'bento/ubuntu-16.04'...
==> default: Matching MAC address for NAT networking...
       ==> default: Checking if box 'bento/ubuntu-16.04' is up to date...
       ==> default: A newer version of the box 'bento/ubuntu-16.04' is available! You currently
       ==> default: have version '2.2.9'. The latest is version '2.3.1'. Run
       ==> default: `vagrant box update` to update.
       ==> default: Setting the name of the VM: kitchen-my_awesome_cookbook-default-ubuntu-1604_default_1484949057424_1716
       ==> default: Clearing any previously set network interfaces...
       ==> default: Preparing network interfaces based on configuration...
           default: Adapter 1: nat
       ==> default: Forwarding ports...
           default: 22 (guest) => 2222 (host) (adapter 1)
       ==> default: Booting VM...
       ==> default: Waiting for machine to boot. This may take a few minutes...
           default: SSH address: 127.0.0.1:2222
           default: SSH username: vagrant
           default: SSH auth method: private key
           default:
           default: Vagrant insecure key detected. Vagrant will automatically replace
           default: this with a newly generated keypair for better security.
           default:
           default: Inserting generated public key within guest...
           default: Removing insecure key from the guest if it's present...
           default: Key inserted! Disconnecting and reconnecting using new SSH key...
       ==> default: Machine booted and ready!
       ==> default: Checking for guest additions in VM...
           default: The guest additions on this VM do not match the installed version of
           default: VirtualBox! In most cases this is fine, but in rare cases it can
           default: prevent things such as shared folders from working properly. If you see
           default: shared folder errors, please make sure the guest additions within the
           default: virtual machine match the version of VirtualBox you have installed on
           default: your host and reload your VM.
           default:
           default: Guest Additions Version: 5.0.26
           default: VirtualBox Version: 5.1
       ==> default: Setting hostname...
       ==> default: Mounting shared folders...
           default: /tmp/omnibus/cache => /Users/mattstratton/.kitchen/cache
       ==> default: Machine not provisioned because `--no-provision` is specified.
       [SSH] Established
       Vagrant instance <default-ubuntu-1604> created.
       Finished creating <default-ubuntu-1604> (0m37.48s).
-----> Kitchen is finished. (0m38.79s)
```
(you might see some more output depending on what needs to be downloaded, but generally, it should look like that)

Let's find out if `apache2` is installed. We can log into the test machine with the `kitchen login` command.

```
 ~/src/my_awesome_cookbook/ [master*] kitchen login
Welcome to Ubuntu 16.04.1 LTS (GNU/Linux 4.4.0-31-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage
Last login: Fri Jan 20 21:51:20 2017 from 10.0.2.2
vagrant@default-ubuntu-1604:~$
```

Whoo. That was exciting. Now I have a root prompt on my test machine. Let's see if the `apache2` package is there.

```
vagrant@default-ubuntu-1604:~$ dpkg -s apache2
dpkg-query: package 'apache2' is not installed and no information is available
Use dpkg --info (= dpkg-deb --info) to examine archive files,
and dpkg --contents (= dpkg-deb --contents) to list their contents.
```

So it's not installed. But it's kind of a pain to have to log in and check manually. I think it would be a lot easier to test for it.

## Writing an InSpec test

We will be writing our tests using the [InSpec](https://www.inspec.io) language. It's cool.

The tests live in the `test/smoke/default` directory of our cookbook. If we take a look in there, we can see there's already a default test (the file is called `default_test.rb`, coincidentally enough). Here's how this file looks right now:

```
# # encoding: utf-8

# Inspec test for recipe my_awesome_cookbook::default

# The Inspec reference, with examples and extensive documentation, can be
# found at http://inspec.io/docs/reference/resources/

unless os.windows?
  describe user('root') do
    it { should exist }
    skip 'This is an example test, replace with your own test.'
  end
end

describe port(80) do
  it { should_not be_listening }
  skip 'This is an example test, replace with your own test.'
end
```

We can see there are two default tests. One checks to see if the user `root` exists (if it's a non-Windows operating system), and the other checks to see if port 80 is listening. We don't actually care about either of those tests - we want to check to see if a package is installed. So let's change the `default_test.rb` file to read as follows:

```
# # encoding: utf-8

# Inspec test for recipe my_awesome_cookbook::default

# The Inspec reference, with examples and extensive documentation, can be
# found at http://inspec.io/docs/reference/resources/

describe package('apache2') do
    it { should be_installed  }
end
```

InSpec tests are written in what is called a Domain Specific Language, or DSL. In the InSpec DSL, we are using the `resource` of the type `package` to tell InSpec what kind of thing we are checking for. We then tell InSpec the behavior we expect. Functionally, we are saying "we expect the package called `apache2` to be installed. If it is not, we are sad."

To run this test, make sure you are back at your own prompt and not inside the VM anymore (you might need to type `exit` to get out of it) and run this `delivery local smoke` command from the `my_awesome_cookbook` directory. This is the expected output:

```
 ~/src/my_awesome_cookbook/ [master*] delivery local smoke
Chef Delivery
Running Smoke Phase
-----> Starting Kitchen (v1.14.2)
-----> Converging <default-ubuntu-1604>...
       Preparing files for transfer
       Preparing dna.json
       Resolving cookbook dependencies with Berkshelf 5.2.0...
       Removing non-cookbook files before transfer
       Preparing validation.pem
       Preparing client.rb
-----> Installing Chef Omnibus (install only if missing)
       Downloading https://omnitruck.chef.io/install.sh to file /tmp/install.sh
       Trying wget...
       Download complete.
       ubuntu 16.04 x86_64
       Getting information for chef stable  for ubuntu...
       downloading https://omnitruck.chef.io/stable/chef/metadata?v=&p=ubuntu&pv=16.04&m=x86_64
         to file /tmp/install.sh.2172/metadata.txt
       trying wget...
       sha1     10b9026d57005aaf31289aec650931a02b5347d3
       sha256   de5991b073fb22aa295fd0142f5e4ed3ca7da6ffe2c3fdcb01da29e4cdd0bd04
       url      https://packages.chef.io/files/stable/chef/12.17.44/ubuntu/16.04/chef_12.17.44-1_amd64.deb
       version  12.17.44
       downloaded metadata file looks valid...
       downloading https://packages.chef.io/files/stable/chef/12.17.44/ubuntu/16.04/chef_12.17.44-1_amd64.deb
         to file /tmp/omnibus/cache/chef_12.17.44-1_amd64.deb
       trying wget...
       Comparing checksum with sha256sum...

       WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING

       You are installing an omnibus package without a version pin.  If you are installing
       on production servers via an automated process this is DANGEROUS and you will
       be upgraded without warning on new releases, even to new major releases.
       Letting the version float is only appropriate in desktop, test, development or
       CI/CD environments.

       WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING

       Installing chef
       installing with dpkg...
       Selecting previously unselected package chef.
(Reading database ... 34966 files and directories currently installed.)
       Preparing to unpack .../chef_12.17.44-1_amd64.deb ...
       Unpacking chef (12.17.44-1) ...
       Setting up chef (12.17.44-1) ...
       Thank you for installing Chef!
       Transferring files to <default-ubuntu-1604>
       Starting Chef Client, version 12.17.44
       Creating a new client identity for default-ubuntu-1604 using the validator key.
       resolving cookbooks for run list: ["my_awesome_cookbook::default"]
       Synchronizing Cookbooks:
         - my_awesome_cookbook (0.1.0)
       Installing Cookbook Gems:
       Compiling Cookbooks...
       Converging 0 resources

       Running handlers:
       Running handlers complete
       Chef Client finished, 0/0 resources updated in 01 seconds
       Finished converging <default-ubuntu-1604> (0m20.17s).
-----> Setting up <default-ubuntu-1604>...
       Finished setting up <default-ubuntu-1604> (0m0.00s).
-----> Verifying <default-ubuntu-1604>...
       Loaded

Target:  ssh://vagrant@127.0.0.1:2222


  System Package
     ∅  apache2 should be installed
     expected that `System Package apache2` is installed

Test Summary: 0 successful, 1 failures, 0 skipped
>>>>>> ------Exception-------
>>>>>> Class: Kitchen::ActionFailed
>>>>>> Message: 1 actions failed.
>>>>>>     Verify failed on instance <default-ubuntu-1604>.  Please see .kitchen/logs/default-ubuntu-1604.log for more details
>>>>>> ----------------------
>>>>>> Please see .kitchen/logs/kitchen.log for more details
>>>>>> Also try running `kitchen diagnose --all` for configuration

```

### So what just happened?

Chef did a bunch of things (most of which we don't have to care about just yet), but at the end, it checked for the `apache2` package, just like we told it to. And it found out it wasn't installed! So the test failed.

The cool thing is we didn't have to tell InSpec *how* to check for the package - just that we cared about a package.

## Fixing the broken test

Well, let's solve the problem. To do this, we need to write some Chef code. Chef uses a DSL very similar to InSpec, so you already sort of know how to fix the broken test.

The default recipe that Chef will run is the file `recipes/default.rb`. If we look at it right now, it's kind of boring:

```
#
# Cookbook:: my_awesome_cookbook
# Recipe:: default
#
# Copyright:: 2017, The Authors, All Rights Reserved.
```

Basically, it's a bunch of comments. The Chef DSL is based upon Ruby, so any text that starts with `#` is considered a comment, and is not evaluate by Chef.

Let's add the Chef code to ensure that the `apache2` package is installed. Add this to the `recipes/default.rb` file:

```
package 'apache2' do
  action :install
end
```

This tells Chef that we want to make sure the `apache2` package is installed. Chef will check if it's installed, and if not, it will install it. If it's already installed, then it won't do anything.

This is *really important* to understand. Chef only takes action if it needs to. We aren't writing a list of commands; we are explaining our *desired state*.

I like to think about it a little bit like how a thermostat works. I tell the thermostat "I would like the temperature in my house to be 70 degrees." My theromostat checks - "Is it 70 degrees?" If so, it doesn't do anything. If not, it turns up the heat. How annoying would it be if I had to tell my thermostat exactly what to do every time? Very annoying, that's how much.

So let's go ahead and apply our Chef configuration. Run `delivery local deploy` from the `my_awesome_cookbook` directory:

```
 ~/src/my_awesome_cookbook/ [master*] delivery local deploy
Chef Delivery
Running Deploy Phase
-----> Starting Kitchen (v1.14.2)
-----> Converging <default-ubuntu-1604>...
       Preparing files for transfer
       Preparing dna.json
       Resolving cookbook dependencies with Berkshelf 5.2.0...
       Removing non-cookbook files before transfer
       Preparing validation.pem
       Preparing client.rb
-----> Chef Omnibus installation detected (install only if missing)
       Transferring files to <default-ubuntu-1604>
       Starting Chef Client, version 12.17.44
       resolving cookbooks for run list: ["my_awesome_cookbook::default"]
       Synchronizing Cookbooks:
         - my_awesome_cookbook (0.1.0)
       Installing Cookbook Gems:
       Compiling Cookbooks...
       Converging 1 resources
       Recipe: my_awesome_cookbook::default
         * apt_package[apache2] action install
           - install version 2.4.18-2ubuntu3.1 of package apache2

       Running handlers:
       Running handlers complete
       Chef Client finished, 1/1 resources updated in 08 seconds
       Finished converging <default-ubuntu-1604> (0m13.73s).
-----> Kitchen is finished. (0m15.79s)
```

### So what just happened?

If we take a look at the output, we can see that the `apache2` package was installed. Just for fun, let's run the `delivery local deploy` command again and see what happens.

```
Recipe: my_awesome_cookbook::default
  * apt_package[apache2] action install (up to date)

Running handlers:
Running handlers complete
Chef Client finished, 0/1 resources updated in 01 seconds
```
Notice that this time, it says the package is "up to date", and the number of "resources updated" is now 0, instead of 1, which is what happened the first time.

## Proving it with our test

In theory, we did what we expected. But let's run our test again, just to make sure:

```
 ~/src/my_awesome_cookbook/ [master*] delivery local smoke
Chef Delivery
Running Smoke Phase
-----> Starting Kitchen (v1.14.2)
-----> Setting up <default-ubuntu-1604>...
       Finished setting up <default-ubuntu-1604> (0m0.00s).
-----> Verifying <default-ubuntu-1604>...
       Loaded

Target:  ssh://vagrant@127.0.0.1:2222


  System Package
     ✔  apache2 should be installed

Test Summary: 1 successful, 0 failures, 0 skipped
       Finished verifying <default-ubuntu-1604> (0m0.33s).
-----> Kitchen is finished. (0m2.20s)
```

Cool! Our test passed. We have just solved a problem with Chef.

## Even more testing

Just because we wrote some Chef code that did a thing, maybe we didn't do it the best way ever. We can run some tests to make sure we've written "good" Chef code. Try this:

```
 ~/src/my_awesome_cookbook/ [master*] delivery local lint
Chef Delivery
Running Lint Phase
Inspecting 6 files
.....C

Offenses:

test/smoke/default/default_test.rb:9:1: C: Use 2 (not 4) spaces for indentation.
    it { should be_installed  }
^^^^
test/smoke/default/default_test.rb:9:29: C: Unnecessary spacing detected.
    it { should be_installed  }
                            ^

6 files inspected, 2 offenses detected
```

Whoops. My code failed the "convention" test, because I didn't indent the way that good Chefs do. I can fix that, and run my test again.

I can also run `delivery local syntax` for even more checks:

```
 ~/src/my_awesome_cookbook/ [master*] delivery local syntax
Chef Delivery
Running Syntax Phase

 ~/src/my_awesome_cookbook/ [master*]
```

Very cool. I passed that test, at least.

## Wrapping up

I could continue, and add more functionality (maybe I want to make sure a certain user exists), and I would use this same looping flow

1. Add the test
2. Run `delivery local verify`
3. See it fail
4. Add something to my recipe
5. Run `delivery local deploy`
6. Run `delivery local verify` to see if my code fixed the condition.
