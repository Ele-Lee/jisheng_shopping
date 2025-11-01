const unzipper = require('unzipper');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { parseStringPromise } = require('xml2js');

// const excelPath = 'excels/demo6.xlsx';
const excelPath = 'excels/情报中心--中秋国庆双节清单选品（最终）.xlsx';
let point = 100;
async function parseExcel() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(excelPath);
  
  const worksheet = workbook.worksheets[4];
  console.log(worksheet.name);
  
  point = parseInt(worksheet.name);
  const dataFileFile = 'products_new_' + point + '.ts';
  const publicDir = path.join(__dirname, '..', 'public', 'products_new_' + point);
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const products = [];
  let headers = [];
  
  const fieldMapping = {
    '序号': 'id',
    '一级分类': 'category',
    '品牌': 'brand',
    '产品名称（全称）': 'name',
    '产品图片': 'imageFormula',
    '商品明细（规格，型号，内配）': 'specification',
    '包裹数量': 'packageQuantity',
    '发货地': 'shippingFrom',
    '代发快递名称': 'courierName',
    '限制发货区域': 'shippingRestrictions',
    '市场价': 'marketPrice',
    '京东链接': 'jdLink',
    '产品卖点/特点': 'features',
    '商品编号': 'productCode'
  };
  
  headers = worksheet.getRow(1).values.slice(1);
  console.log('Headers:', headers);
  
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }
    
    const product = {
      price: point,
    };
    let imageId = null;
    
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber - 1];
      const englishField = fieldMapping[header] || header;
      if (cell.type === ExcelJS.ValueType.Hyperlink) {
        product[englishField] = cell.text;
      } else if (cell.type === ExcelJS.ValueType.Formula && header === '产品图片') {
        const formula = cell.value?.formula || '';
        const match = formula.match(/ID_([A-F0-9]+)/);
        if (match) {
          imageId = match[0];
          product.imageId = imageId;
        }

        console.log('%celelee test:', 'color:#fff;background:#000',imageId)
        product[englishField] = cell.value;
      } else {
        product[englishField] = cell.value;
      }
    });
    
  
    
    products.push(product);
  });
  
  
  const media = await extractImagesFromExcel(excelPath)
  media.forEach((img) => {
    const ext = img.extension;
    const fileName = `${img.name}${ext}`;
    const filePath = path.join(publicDir, fileName);
    fs.writeFileSync(filePath, img.buffer);
    const product = products.find(item => item.imageId === img.name);
    if (product) {
      product.image = `/products_new_${point}/${fileName}`;
    }
  });
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  products.forEach(product => {
    delete product.imageFormula;
    delete product.undefined;
  });
  
  const outputPath = path.join(dataDir, dataFileFile);
  const tsContent = `export const midAutumnProducts = ${JSON.stringify(products, null, 2)};\n`;
  
  fs.writeFileSync(outputPath, tsContent);
  
  console.log(`✅ Parsed ${products.length} products`);
  console.log(`✅ Data saved to: ${outputPath}`);
  console.log(`✅ Images saved to: ${publicDir}`);
}


async function extractImagesFromExcel(filePath) {
  const zip = await unzipper.Open.file(filePath);
  // 获取 cellimages.xml 和 cellimages.xml.rels 文件
  const cellimagesFile = zip.files.find(
    (file) => file.path === 'xl/cellimages.xml',
  );
  const cellimagesRelsFile = zip.files.find(
    (file) => file.path === 'xl/_rels/cellimages.xml.rels',
  );

  if (!cellimagesFile || !cellimagesRelsFile) {
    return [];
  }

  // 解析 cellimages.xml 和 cellimages.xml.rels 文件
  const cellimagesXml = await cellimagesFile.buffer();
  const cellimagesRelsXml = await cellimagesRelsFile.buffer();
  const cellimagesData = await parseStringPromise(cellimagesXml.toString());
  const cellimagesRelsData = await parseStringPromise(
    cellimagesRelsXml.toString(),
  );

  // 从 cellimages.xml 文件中提取图片名称和 rid 的映射关系
  const cellimagesNameRidMap = {};
  cellimagesData['etc:cellImages']['etc:cellImage'].forEach((pic) => {
    const rid =
      pic['xdr:pic'][0]['xdr:blipFill'][0]['a:blip'][0].$['r:embed'];
    const name = pic['xdr:pic'][0]['xdr:nvPicPr'][0]['xdr:cNvPr'][0].$.name;
    cellimagesNameRidMap[rid] = name;
  });

  // 从 cellimages.xml.rels 文件中提取图片数据
  const mediaArray = [];
  for (const relationship of cellimagesRelsData['Relationships'][
    'Relationship'
  ]) {
    try {
      const rid = relationship.$.Id;
      const target = relationship.$.Target;
      const extension = path.extname(target);
      const match = target.match(/image(\d+)/);
      if (!match) {
        continue;
      }
      const index = parseInt(match[1], 10);
      const imgFile = zip.files.find((file) => file.path === `xl/${target}`);

      if (imgFile) {
        const buffer = await imgFile.buffer();
        mediaArray.push({
          type: 'image',
          name: `${cellimagesNameRidMap[rid]}`,
          extension,
          buffer,
          index,
        });
      }
    } catch (error) {

      console.error('%celelee err:', 'color:#fff;background:#000', error)
    }
    
  }

  return mediaArray;
}


parseExcel().catch(console.error);
