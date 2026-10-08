# Run with: bundle exec ruby bin/test-teaching-resources.rb
require 'jekyll'
require 'tmpdir'
require 'fileutils'
require 'cgi'
require 'uri'
require_relative '../_plugins/teaching-resources'

def assert(condition, message)
  raise message unless condition
end

repository = File.expand_path('..', __dir__)
Dir.mktmpdir('teaching-resources-') do |temporary|
  source = File.join(temporary, 'source')
  destination = File.join(temporary, 'output')
  FileUtils.mkdir_p(File.join(source, '_data'))
  %w[_includes _layouts].each { |directory| FileUtils.cp_r(File.join(repository, directory), source) }
  FileUtils.cp(File.join(repository, '_data/teaching.yml'), File.join(source, '_data'))
  data_path = File.join(source, '_data/teaching.yml')
  data = YAML.load_file(data_path)
  data['modules'].first['chapters'].first['resources'] = {
    'slides' => [{'title' => '保留手动资源', 'file' => '/assets/manual.pdf'}]
  }
  File.write(data_path, data.to_yaml)
  FileUtils.cp(File.join(repository, '_pages/teaching.md'), File.join(source, 'teaching.md'))

  downloads = [
    'assets/teaching/02/slides/10 矩阵 &copy; 导数.pdf',
    'assets/teaching/02/slides/2 向量.PDF',
    'assets/teaching/02/board_notes/课堂 板书.pdf',
    'assets/teaching/04/board_notes/回归板书.pdf',
    'assets/teaching/02/additional_materials/2 补充阅读.PDF',
    'assets/teaching/02/additional_materials/10 延伸 &copy; 阅读.pdf',
    'assets/teaching/05/additional_materials/分类补充阅读.pdf'
  ]
  fixtures = downloads + [
    'assets/teaching/02/slides/ignore.txt',
    'assets/teaching/99/slides/未知章节.pdf'
  ]
  fixtures.each do |path|
    file = File.join(source, path)
    FileUtils.mkdir_p(File.dirname(file))
    # Deliberately opaque bytes: catalog generation must not parse or decrypt PDFs.
    File.binwrite(file, "\x00\xFFopaque encrypted resource".b)
  end

  config = Jekyll.configuration('source' => source, 'destination' => destination,
                                'baseurl' => '/course-preview', 'url' => 'https://example.test',
                                'plugins' => [], 'quiet' => true)
  site = Jekyll::Site.new(config)
  site.process
  chapters = site.data['teaching']['modules'].flat_map { |mod| mod['chapters'] }
  linear = chapters.find { |chapter| chapter['number'] == '02' }
  assert(linear['resources']['slides'].map { |doc| doc['title'] } == ['2 向量', '10 矩阵 &copy; 导数'], 'Natural order or uppercase PDF discovery failed')
  assert(linear['resources']['board_notes'].size == 1, 'Mixed resource types failed')
  assert(linear['resources']['additional_materials'].map { |doc| doc['title'] } == ['2 补充阅读', '10 延伸 &copy; 阅读'], 'Additional materials discovery/sorting failed')
  regression = chapters.find { |chapter| chapter['number'] == '04' }
  assert(regression['resources']['slides'].empty? && regression['resources']['board_notes'].size == 1, 'Board-only chapter failed')
  assert(chapters.first['resources']['slides'].first['title'] == '保留手动资源', 'Existing manual resources were lost')
  classification = chapters.find { |chapter| chapter['number'] == '05' }
  assert(classification['resources']['additional_materials'].size == 1 && classification['resources']['slides'].empty? && classification['resources']['board_notes'].empty?, 'Additional-materials-only chapter failed')
  assert(chapters.find { |chapter| chapter['number'] == '06' }['resources'].values.all?(&:empty?), 'Empty chapter failed')

  html = File.read(File.join(destination, 'teaching/index.html'))
  assert(html.include?('10 矩阵 &amp;copy; 导数'), 'Filename title was not HTML escaped')
  assert(html.include?('下载回归板书：回归板书'), 'Board-only link missing from outline')
  assert(html.include?('下载分类附加材料：分类补充阅读'), 'Additional-materials-only link missing from outline')
  assert(html.include?('附加材料 · 10 延伸 &amp;copy; 阅读'), 'Multiple additional materials were not individually named/escaped')
  assert(!html.include?('未知章节') && !html.include?('ignore.txt'), 'Invalid files were listed')
  rendered_paths = html.scan(/href="([^"]+)"/).flatten.map { |url| URI::DEFAULT_PARSER.unescape(CGI.unescapeHTML(url)).force_encoding('UTF-8') }
  downloads.each do |path|
    assert(File.binread(File.join(destination, path)) == File.binread(File.join(source, path)), 'PDF bytes changed during build')
    assert(rendered_paths.count("/course-preview/#{path}") == 1, 'Outline download missing, duplicated, or incorrectly encoded')
  end

  # Explicit metadata for an automatic path must override it, without duplicates.
  path = '/assets/teaching/02/slides/2 向量.PDF'
  linear['resources']['slides'].unshift('title' => '自定义标题', 'file' => path, 'download_name' => 'vectors.pdf')
  TeachingResources::Generator.new.generate(site)
  duplicate = linear['resources']['slides'].select { |doc| doc['file'] == path }
  assert(duplicate.size == 1 && duplicate.first['title'] == '自定义标题', 'Manual override/deduplication failed')

  # A subsequent build re-reads the data and reflects removed/renamed files.
  FileUtils.mv(File.join(source, fixtures[1]), File.join(source, 'assets/teaching/02/slides/3 更新向量.pdf'))
  FileUtils.rm(File.join(source, fixtures[3]))
  FileUtils.mv(File.join(source, downloads[4]), File.join(source, 'assets/teaching/02/additional_materials/3 更新补充阅读.pdf'))
  FileUtils.rm(File.join(source, downloads[6]))
  site.process
  html = File.read(File.join(destination, 'teaching/index.html'))
  assert(html.include?('3 更新向量') && !html.include?('2 向量') && !html.include?('回归板书'), 'Rename/removal left stale catalog entries')
  assert(!File.exist?(File.join(destination, fixtures[1])) && !File.exist?(File.join(destination, fixtures[3])), 'Removed downloads left stale output files')
  assert(html.include?('3 更新补充阅读') && !html.include?('2 补充阅读') && !html.include?('分类补充阅读'), 'Additional material rename/removal left stale links')
  assert(!File.exist?(File.join(destination, downloads[4])) && !File.exist?(File.join(destination, downloads[6])), 'Removed additional downloads left stale output files')
  puts 'PASS: discovery, natural sorting, mixed/board-only/additional-only resources, opaque PDFs, escaping, baseurl, manual overrides, rename/removal, and rendered downloads.'
end
