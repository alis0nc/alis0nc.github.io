---
title: Better continuous integration for LaTeX projects
layout: default
---

## Better continuous integration for LaTeX projects

*30 November 2017*

I was recently inspired to streamline the workflow of building [my résumé](https://github.com/alis0nc/alisonc-resume). It's built in [LaTeX](https://www.latex-project.org), with some conditional compilation tricks to create different versions (e.g. different email addresses, with/without phone number, include/exclude semi-irrelevant employment experience) from one source file. 

Previously I did this with a shell script and uploading the output pdf files to the repository, but I wasn't satisfied with that. I had to maintain several different build scripts (`.sh` for Linux boxes, `.bat` for Windows boxes, `Makefile` for boxes where I had cloned the repository to a `noexec` filesystem) and change all three of them when I added a new  compilation flag. And then remember to run the build before committing. And then remember to `git add` the changed pdfs. And then commit the pdfs, which is [something one should not do](https://development.robinwinslow.uk/2013/06/11/dont-ever-commit-binary-files-to-git/). Yeah. Terrible.

I briefly toyed with the idea of writing my own [bhook](https://developer.github.com/webhooks/) consumer for the repository, which would subscribe to push events and rebuild the pdfs on a push. Then I realised that's essentially a reinvention of [continuous integration](https://en.wikipedia.org/wiki/Continuous_integration), and why should I write my own crappy pseudo-CI résumé compiler when there are plenty of real CI services out there, and probably somebody who's done the work of setting up a LaTeX project to work with a CI service already.

![Google search bar: "LaTeX continuous integration"](/images/google-latex-ci.png)

Sure enough, this is a thing. The first result is Miro Cupak's [Continuous Integration for LaTeX](https://mirocupak.com/continuous-integration-for-latex/), which lays out a pretty coherent argument why LaTeX projects deserve CI too. I initially followed his setup, which uses [Travis-CI](https://travis-ci.org/) and the [TeX Live](https://www.tug.org/texlive/) distribution packaged with Ubuntu.

However, I quickly ran into some problems. My résumé uses the [Roboto](https://fonts.google.com/specimen/Roboto) and [Inconsolata](https://fonts.google.com/specimen/Inconsolata) fonts via the [`roboto`](https://ctan.org/pkg/roboto?lang=en) and [`inconsolata`](https://ctan.org/pkg/inconsolata?lang=en) TeX Live packages, which I was attempting to install à la carte by using [`tlmgr`](https://www.tug.org/texlive/tlmgr.html), the TeX Live package manager. (I didn't realise they were both included in the [`texlive-fonts-extra`](https://packages.ubuntu.com/xenial/texlive-fonts-extra) Ubuntu package. Oops.) `tlmgr` wasn't successful because of an incompatibility between TeX Live 2015 and later database format (see [this TeX.SX answer](https://tex.stackexchange.com/questions/313768/why-getting-this-error-tlmgr-unknown-directive/314797)), so I set about designing a solution that (1) was quicker to run than seven or eight minutes for the Travis-CI virtual machine to start up and install a full TeX Live distribution and (2) used vanilla TeX Live instead of the Ubuntu packaged version.

What I came up with installs a minimal TeX Live distribution using [`install-tl`](https://www.tug.org/texlive/quickinstall.html) and a pre-generated installation profile, then automatically discovers dependencies using [`texliveonfly`](https://ctan.org/pkg/texliveonfly?lang=en). I used `install-tl` as a normal user because `sudo`-enabled Travis build instances (which is obviously required for installing packages using `apt`) are [full virtual machines](https://docs.travis-ci.com/user/reference/overview/#Sudo-enabled) which take longer to spin up than container-based non-`sudo`-enabled build instances, and `texliveonfly` because installing a minimal list of packages then discovering dependencies dynamically is faster than installing the full complement of packages.

The `.travis.yml` and `texlive.profile` are below.

<script src="https://gist.github.com/alis0nc/aac43724f3d30bc63e01710f7e55f90c.js"></script>

This results in a total build and deploy time of [around two minutes](https://travis-ci.org/alis0nc/alisonc-resume/builds), instead of eight minutes for Miro's method. This could probably be improved with a bit of manual intervention -- `texliveonfly` resolves dependencies "whack-a-mole" style i.e. keeps compiling the same document over and over again, halting on missing package errors, installing that package, until compilation succeeds. If you examined the build output to find what packages `texliveonfly` is installing, then added them to the `before_install` step of `.travis.yml`, performance would improve.

*Edit 2018-05-08: Expanded upon reason for choosing vanilla TeX Live and `texliveonfly`.*
