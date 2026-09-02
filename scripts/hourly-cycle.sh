# Run the hourly domain intelligence cycle.
# Adjust: maxTopics (10-30), validate (true for production, false for speed).
cd /opt/data/linkshub && node server/intelligence/run.mjs --no-validate --max-topics=15 --max-validations=5 >> data/hourly.log 2>&1
