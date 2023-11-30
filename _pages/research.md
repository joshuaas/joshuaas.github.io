---
layout: research
permalink: /research/
title: Research
nav: true
nav_order: 3
types: ['TPAMI', 'ICML', 'NeurIPS', 'CVPR', 'ICCV', 'TIP', 'AAAI', 'MM' ]
paper_titles_partial: ['When All We Need is a Piece of the Pie: A Generic Framework for Optimizing Two-way Partial AUC', 'Optimizing Two-way Partial AUC with an End-to-end Framework', 'Asymptotically Unbiased Instance-wise Regularized Partial AUC Optimization: Theory and Algorithm']
paper_titles_multiclass: ['Learning with Multiclass AUC: Theory and Algorithms']
paper_titles_generalized: ['Weighted ROC Curve in Cost Space: Extending AUC to Cost-Sensitive Learning']
---

I'm especially interested in several fundamental problems in machine learning:

- Decision Invariant Optimization (Xcurve Framework)

    Recently, machine learning and deep learning technologies have been successfully employed in many complicated high-stake decision-making applications such as disease prediction, fraud detection, outlier detection, and criminal justice sentencing. All these applications share a common trait known as risk-aversion in economics and finance terminologies. In other words, the decision-makers tend to have an extremely low risk tolerance. Under this context, the decision-makers will carefully choose their decision parameter to meet the specific requirement. Consequently, the decision parameters for train and test might be quite different. To mitigate the decision parameter shift problem,  I'm seeking for new decision-invariant machine learning machanisms , on top of which we develop a new framework called [Xcurve](https://xcurveopt.github.io/).

    The goal of X-curve learning is to learn high-quality models that can adapt to different decision conditions. Inspired by the fundamental principle of the well-known AUC optimization, our library provides a systematic solution to optimize the area under different kinds of performance curves. To be more specific, the performance curve is formed by a plot of two performance functions $$x(\lambda)$$, $$y(\lambda)$$ of decision parameter $$\lambda$$. The area under a performance curve becomes the integral of the performance over all possible choices of different decision conditions. In this way, the learning systems are only required to optimize a decision-invariant metric to avoid the risk aversion issue

    ![xcurve](/assets/img/xcurve.png){:width="100%"}

    Four Kinds of Performance Curves

    ![xcurve-insight](/assets/img/xcurve-insight.png){:width="100%"}

- Trustworthy Machine Learning 

    We are seeking for new principled method to make the current machine learning system trustworthy (e.g. Robustness against Adversarial attacks, OOD examples). On top of Xcurve, I'm especially interested in  (a) how to design performance-based metrics for trustworthy machine learning, and (b) how to use the SOTA models and idea of trustworthy machine learning to improve the Xcurve Framework. 

- Long-tail Learning

    Long-tail learning is one of the most challenging problems in machine learning, which aims to train well-performing models from a large number of examples that follow a highly imbalanced class distribution. We find that the long-tail problem could be mitigated by adjusting the optimal decision rule. On top of the Xcurve framework, we are interested in (a) how to design distribution-invariant metrics for long-tail learning to deal with different long-tail distributions, and (b) how to directly optimize such metrics efficiently. 