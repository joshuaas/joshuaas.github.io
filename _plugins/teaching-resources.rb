# Build the download catalog from static files, without opening PDF contents.
module TeachingResources
  class Generator < Jekyll::Generator
    safe true
    priority :high

    def generate(site)
      course = site.data['teaching']
      return unless course

      directory = course.fetch('resource_directory', 'assets/teaching').sub(%r{\A/+}, '').sub(%r{/+\z}, '')
      prefix = "/#{directory}/"
      chapters = Array(course['modules']).flat_map { |mod| Array(mod['chapters']) }
      chapters_by_number = chapters.to_h { |chapter| [chapter['number'].to_s, chapter] }
      types = Array(course['resource_types']).map { |type| type['id'] }
      discovered = Hash.new { |hash, key| hash[key] = [] }

      site.static_files.each do |file|
        path = file.relative_path
        next unless path.start_with?(prefix) && File.extname(path).downcase == '.pdf'

        number, type, filename, extra = path.delete_prefix(prefix).split('/')
        unless chapters_by_number.key?(number) && types.include?(type) && filename && !extra
          Jekyll.logger.warn 'Teaching resources:', "Skipped #{path}; expected #{prefix}CHAPTER/TYPE/FILENAME.pdf"
          next
        end

        discovered[[number, type]] << {
          'title' => File.basename(filename, File.extname(filename)),
          'file' => path,
          'download_name' => filename
        }
      end

      chapters.each do |chapter|
        resources = chapter['resources'] ||= {}
        types.each do |type|
          manual = Array(resources[type])
          automatic = discovered[[chapter['number'].to_s, type]].sort_by { |document| natural_key(document['title']) }
          # A manually configured title/download name takes precedence for the same file.
          resources[type] = (manual + automatic).uniq { |document| document['file'] }
        end
      end
    end

    private

    def natural_key(title)
      title.split(/(\d+)/).map { |part| part.match?(/\A\d+\z/) ? [0, part.to_i] : [1, part.downcase] }
    end
  end
end
