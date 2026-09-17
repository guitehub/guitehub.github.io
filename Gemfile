source "https://rubygems.org"

# Jekyll pour le développement local (bundle exec jekyll serve).
# En production, GitHub Pages construit le site en mode classique avec Jekyll 3.10 et ignore ce
# fichier : ne rien utiliser qui n'existe qu'en Jekyll 4, ni de plugin hors liste blanche.
gem "jekyll", "~> 4.3.4"
gem "rouge"

group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"
end

# Windows et JRuby : données de fuseaux horaires non fournies par le système.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Windows : surveillance des fichiers plus efficace pour jekyll serve.
gem "wdm", "~> 0.1", :platforms => [:mingw, :x64_mingw, :mswin]

# JRuby : http_parser.rb 0.6.x (les versions suivantes n'ont pas d'équivalent Java).
gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]
