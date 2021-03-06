# Colored Regions 2 for Visual Studio Code

This package provides a simple way of colorizing regions.

<br>

# Features

Customize your regions by providing a `rgba(r, g, b, a)` color, or create a custom `named color` in **user settings** or **package.json** (workspace) and use it.

![features](images/features.png)

The extension now allows you to define your own `custom regex` for detecting regions, meaning you can customize the region coloring to your own needs.

<br>

# Settings

Settings will be read from (listed by priority):

1) package.json (workspace)

![package settings](images/package-json.png)

2) user settings

![user settings](images/settings-json.png)

<br>

# Examples

![regions example](images/regions.png)

![named colors](images/named_colors.png)

![supported regions](images/supported_regions.png)

<br>

# FAQ

1. How does the `custom regionRegex` work?
    
    The regex has two capturing groups. The first captures the color (or your own custom color name) which tells the extension how to color the region `(it MUST be in rgba() format)`. The second captures the text that's between the `region` - `endregion` tags, to calculate the range it needs to color.
