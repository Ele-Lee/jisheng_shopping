const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const excelPath = path.join(__dirname, '../excels/123中秋国庆双节清单选品.xlsx');
const imagesDir = path.join(__dirname, '../public/products');
const outputPath = path.join(__dirname, '../data/products.ts');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const fieldMapping = {
  '序号': 'id',
  '一级分类': 'category',
  '品牌': 'brand',
  '产品名称（全称）': 'name',
  '产品图片': 'image',
  '商品明细（规格，型号，内配）': 'specification',
  '包裹数量': 'packageCount',
  '发货地': 'shipFrom',
  '代发快递名称': 'courier',
  '限制发货区域': 'shippingRestriction',
  '市场价': 'price',
  '京东链接': 'jdLink',
  '产品卖点/特点': 'features',
  '商品编号': 'productCode'
};

async function convertImage(buffer, ext) {
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
    return { buffer, ext: 'jpg' };
  }
  
  if (ext === 'emf' || ext === 'wmf') {
    console.log(`  ⚠ EMF/WMF格式暂不支持转换，跳过`);
    return null;
  }
  
  try {
    const converted = await sharp(buffer)
      .jpeg({ quality: 90 })
      .toBuffer();
    return { buffer: converted, ext: 'jpg' };
  } catch (err) {
    console.log(`  ⚠ 转换失败: ${err.message}`);
    return null;
  }
}

async function parseExcel() {
  console.log('读取 Excel 文件...');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);
  
  const worksheet = workbook.worksheets[0];
  console.log(`Sheet 名称: ${worksheet.name}`);
  console.log(`行数: ${worksheet.rowCount}`);
  
  const headerRow = worksheet.getRow(1);
  const headers = [];
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber - 1] = cell.value;
  });
  
  console.log('表头:', headers);
  
  const products = [];
  
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const product = {};
    
    headers.forEach((header, index) => {
      const cell = row.getCell(index + 1);
      let value = cell.value;
      
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object' && value.formula) {
          value = value.result || '';
        }
        
        const englishField = fieldMapping[header] || header;
        product[englishField] = value;
      }
    });
    
    if (Object.keys(product).length > 0) {
      products.push(product);
    }
  }
  
  console.log(`\n解析到 ${products.length} 个商品`);
  
  const imageMap = new Map();
  let savedImageCount = 0;
  
  console.log('\n开始提取图片...');
  const images = worksheet.getImages();
  
  console.log(`找到 ${images.length} 个图片对象`);
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    try {
      const img = workbook.model.media[image.imageId];
      if (!img) continue;
      
      const range = image.range;
      if (!range || !range.tl) continue;
      
      const rowIndex = range.tl.nativeRow;
      
      const converted = await convertImage(img.buffer, img.extension);
      
      if (converted) {
        const fileName = `product_${rowIndex}.${converted.ext}`;
        const filePath = path.join(imagesDir, fileName);
        const relativePath = `/products/${fileName}`;
        
        fs.writeFileSync(filePath, converted.buffer);
        
        imageMap.set(rowIndex, relativePath);
        savedImageCount++;
        
        if (savedImageCount <= 10 || savedImageCount % 10 === 0) {
          console.log(`✓ 保存图片 ${savedImageCount}: ${fileName} (行${rowIndex})`);
        }
      }
    } catch (err) {
      console.error(`✗ 处理图片 ${i} 失败:`, err.message);
    }
  }
  
  console.log(`\n成功保存 ${savedImageCount} 张图片`);
  
  products.forEach((product, index) => {
    const rowNumber = index + 2;
    if (imageMap.has(rowNumber)) {
      product.imageUrl = imageMap.get(rowNumber);
    }
  });
  
  console.log('\n前3个商品示例:');
  products.slice(0, 3).forEach(p => {
    console.log(`- ${p.name} (价格:¥${p.price}, 图片:${p.imageUrl || '无'})`);
  });
  
  const outputContent = `export interface Product {
  id?: number | string
  category?: string
  brand?: string
  name?: string
  image?: string
  imageUrl?: string
  specification?: string
  packageCount?: number
  shipFrom?: string
  courier?: string
  shippingRestriction?: string
  price?: number
  jdLink?: string
  features?: string
  productCode?: string
  [key: string]: any
}

export const products: Product[] = ${JSON.stringify(products, null, 2)}

export const totalProducts = ${products.length}
export const productsWithImages = ${products.filter(p => p.imageUrl).length}
`;
  
  fs.writeFileSync(outputPath, outputContent, 'utf-8');
  console.log(`\n✓ 数据文件已生成: ${outputPath}`);
  console.log(`  商品总数: ${products.length}`);
  console.log(`  有图片商品: ${products.filter(p => p.imageUrl).length}`);
  console.log('\n完成！');
}

parseExcel().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
