const fs = require('fs');
const path = require('path');

class PromptService {
  constructor() {
    this.templates = {};
    this.loadPrompts();
  }

  loadPrompts() {
    try {
      console.log('🔄 Đang tải các prompt templates...');
      const filePath = path.join(__dirname, '..', 'prompts', 'templates.json');
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Không tìm thấy file templates: ${filePath}`);
        return;
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      this.templates = JSON.parse(data);
      
      console.log(`✅ Đã tải ${Object.keys(this.templates).length} prompt templates`);
      console.log(`📝 Các templates đã tải: ${Object.keys(this.templates).join(', ')}`);
    } catch (error) {
      console.error('❌ Lỗi khi tải prompt templates:', error);
    }
  }

  getPrompt(templateName, variables = {}) {
    if (!this.templates[templateName]) {
      console.error(`❌ Không tìm thấy template: ${templateName}`);
      throw new Error(`Template "${templateName}" không tồn tại`);
    }
    
    let promptText = this.templates[templateName].template;
    
    // Thay thế các biến trong template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      promptText = promptText.replace(placeholder, value);
    }
    
    console.log(`📋 Đã tạo prompt sử dụng template: ${templateName}`);
    return promptText;
  }

  // Thêm method cho phép reload templates từ file
  reloadPrompts() {
    console.log('🔄 Đang tải lại prompt templates...');
    this.loadPrompts();
    return Object.keys(this.templates).length;
  }
}

module.exports = new PromptService(); 