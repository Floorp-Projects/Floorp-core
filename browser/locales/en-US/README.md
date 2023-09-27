# Floorp English Localization

This repository contains the English localization for Floorp.

## Fixing the English Localization

If you notice any issues with the English localization, you can modify or fix it by following these steps:

1. Fork this repository by clicking the [Fork](https://github.com/Floorp-Projects/Floorp-Strings/fork) button.

2. Clone your forked repository to your local machine using the following command:

```bash
git clone https://github.com/{YOUR_USERNAME}/Floorp-Strings.git 
```

3. Create a new branch for your improvements using the following command:

```bash
git checkout -b your_branch
```

3. Edit `floorp.ftl` file.

The `ftl` file extension is used for Fluent localization files. You can learn more about the Fluent localization format by visiting the [official Fluent documentation](https://projectfluent.org/fluent/guide/).

To localize a string, simply modify the text after the `=` sign.


4. Commit your changes.

```bash
git add .
git commit -m "Your commit message"
```

5. Push your changes.

```bash
git push origin your_branch
```

6. Create a pull request.

[Create Pull Request](https://github.com/Floorp-Projects/Floorp/compare)

## Adding a New Language

We are currently working on creating a new Pontoon instance for localizing Floorp. Please stay tuned for further updates. 
