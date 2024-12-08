# LaGuite's Github Pages

Link : [GuiteHub](https://guitehub.github.io)

## Gettings started

### Prerequies

install ruby : https://rubyinstaller.org/downloads/

### Installation :

clone repos

run
`bundle install`

then
`bundle exec jekyll serve`

ensuite ouvrir [http://localhost:4000](http://localhost:4000)

## Todo :
 - breadcrumbs
 - analytics
 - refaire page d'accueil

.BMDTU





# LaGuite's Github Pages

Link : [GuiteHub](https://guitehub.github.io)

## Getting Started

### Prerequisites

1. **Install Ruby with DevKit** :  
   Download and install from [rubyinstaller.org](https://rubyinstaller.org/downloads/).  
   - During installation, select the option to install **MSYS2**.

2. **Verify Ruby and Bundler installation** :  
   ```bash
   ruby -v
   gem install bundler
   ```

### Installation

1. **Install dependencies** :
   ```bash
   bundle install
   ```

2. **Run the development server** :
   ```bash
   bundle exec jekyll serve
   ```

3. **Open the site** :  
   Visit [http://localhost:4000](http://localhost:4000) in your browser.

### Troubleshooting

- If errors occur related to `wdm` on Windows, comment out the following line in the `Gemfile` and rerun `bundle install` :
  ```ruby
  gem "wdm", "~> 0.1.1", platforms: [:mingw, :x64_mingw, :mswin]
  ```

- To update all dependencies, run :
  ```bash
  bundle update
  ```

---

## TODO

- Breadcrumbs
- Analytics
- Redesign homepage

.BMDTU