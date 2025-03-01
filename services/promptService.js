const fs = require('fs');
const path = require('path');

class PromptService {
  constructor() {
    this.templates = {};
    this.loadTemplates();
  }

  loadTemplates() {
    try {
      const templatesPath = path.join(__dirname, '..', 'prompts', 'templates.json');
      const templateData = fs.readFileSync(templatesPath, 'utf8');
      this.templates = JSON.parse(templateData);
      console.log(`📝 Đã tải ${Object.keys(this.templates).length} templates`);
    } catch (error) {
      console.error('❌ Lỗi khi tải templates:', error);
      // Khởi tạo với object rỗng nếu có lỗi
      this.templates = {};
    }
  }

  getPrompt(templateName, data = {}) {
    // Kiểm tra xem template có tồn tại không
    if (!this.templates[templateName]) {
      console.error(`❌ Không tìm thấy template: ${templateName}`);
      throw new Error(`Template "${templateName}" không tồn tại`);
    }

    // Lấy template content - kiểm tra cả trường hợp template là object hoặc string
    let templateContent;
    if (typeof this.templates[templateName] === 'object' && this.templates[templateName].template) {
      templateContent = this.templates[templateName].template;
    } else if (typeof this.templates[templateName] === 'string') {
      templateContent = this.templates[templateName];
    } else {
      throw new Error(`Template "${templateName}" không có nội dung hợp lệ`);
    }

    // Thay thế các placeholder trong template
    let prompt = templateContent;
    
    // Duyệt qua tất cả các khóa trong data và thay thế vào template
    for (const key in data) {
      if (data[key] === undefined || data[key] === null) {
        data[key] = ''; // Đặt giá trị mặc định là chuỗi rỗng nếu giá trị là undefined hoặc null
      }
      
      // Đảm bảo data[key] là string trước khi gọi replace
      const value = String(data[key]);
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      prompt = prompt.replace(placeholder, value);
    }

    return prompt;
  }

  // Thêm method cho phép reload templates từ file
  reloadPrompts() {
    console.log('🔄 Đang tải lại prompt templates...');
    this.loadTemplates();
    return Object.keys(this.templates).length;
  }
}

module.exports = new PromptService(); 