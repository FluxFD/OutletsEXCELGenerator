const express = require("express");
const cors = require("cors");
const ExcelJS = require("exceljs");
const XLSXChart = require("xlsx-chart");
const path = require("path");
const fs = require("fs");
const app = express();

app.use(cors());
app.use(express.json());

app.post("/generate-chart", async (req, res) => {
  const tempFile = path.join(__dirname, "charts.xlsx");
  try {
    const [amenities, visits, stores, maps] = req.body;
    // Step 2: Generate chart using XLSX-Chart
    const xlsxChart = new XLSXChart();
    let chartData;
    await new Promise((resolve, reject) => {
      xlsxChart.generate(
        {
          charts: [
            {
              chart: "column",
              titles: ["Used", "Preferred"],
              fields: amenities.map((a) => a.title),
              data: {
                Used: amenities.reduce((acc, a) => {
                  acc[a.title] = a.used;
                  return acc;
                }, {}),
                Preferred: amenities.reduce((acc, a) => {
                  acc[a.title] = a.preferred;
                  return acc;
                }, {}),
              },
              chartTitle: "Amenities Usage vs Preference",
            },
            {
              chart: "line",
              titles: ["Daily Visits"],
              fields: visits
                .sort((a, b) => new Date(a.Date) - new Date(b.Date))
                .map((d) => d.Date),
              data: {
                "Daily Visits": visits.reduce((acc, d) => {
                  acc[d.Date] = d.Count;
                  return acc;
                }, {}),
              },
              chartTitle: "Daily Visits Analytics",
            },
            {
              chart: "bar",
              titles: ["Clicks", "Searches"],
              fields: stores.map((s) => s.title),
              data: {
                Clicks: stores.reduce((acc, s) => {
                  acc[s.title] = s.clicks;
                  return acc;
                }, {}),
                Searches: stores.reduce((acc, s) => {
                  acc[s.title] = s.searchs;
                  return acc;
                }, {}),
              },
              chartTitle: "Store Analytics",
            },
            {
              chart: "bar",
              titles: ["Clicks", "Searches"],
              fields: maps.map((m) => m.title),
              data: {
                Clicks: maps.reduce((acc, m) => {
                  acc[m.title] = m.clicks;
                  return acc;
                }, {}),
                Searches: maps.reduce((acc, m) => {
                  acc[m.title] = m.searchs;
                  return acc;
                }, {}),
              },
              chartTitle: "Maps Analytics - Clicks vs Searches",
            },
          ],
        },
        (err, data) => {
          if (err) reject(err);
          chartData = data; // Store chart data in variable
          fs.writeFileSync(tempFile, data);
          resolve(data);
        }
      );
    });

    res.download(tempFile, 'analytics_charts.xlsx', (err) => {
        fs.unlink(tempFile, (unlinkErr) => {
            if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
        });
        if (err) console.error('Error sending file:', err);
    });
  } catch (error) {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    console.error(error);
    res.status(400).json({ error: "Failed to generate charts" });
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
