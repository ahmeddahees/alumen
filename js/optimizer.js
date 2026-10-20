/**
 * 1D Cutting Stock Optimizer
 * خوارزمية ذكية لتقطيع أعواد الألومنيوم بأقل نسبة هدر وسقاطة ممكنة
 */

const CuttingOptimizer = {
    /**
     * تحسين توزيع القطع على الأعواد الخام
     * @param {Array} pieces - مصفوفة القطع المطلوب قصها
     * @param {number} stockLength - طول العود الخام بالسم (مثلاً 600 أو 650)
     * @param {number} bladeKerf - سمك سلاح المنشار بالسم (مثلاً 0.4 سم)
     */
    optimize(pieces, stockLength = 600, bladeKerf = 0.4) {
        if (!pieces || pieces.length === 0) {
            return {
                bars: [],
                totalBars: 0,
                totalStockMeters: 0,
                totalUsedMeters: 0,
                totalWasteMeters: 0,
                wastePercentage: 0,
                efficiency: 100
            };
        }

        // فلترة القطع والتأكد أن لا توجد قطعة أطول من العود الخام
        const validPieces = [];
        const oversizedPieces = [];

        pieces.forEach(p => {
            if (p.length > stockLength) {
                oversizedPieces.push(p);
            } else if (p.length > 0) {
                validPieces.push({ ...p });
            }
        });

        // ترتيب القطع تنازلياً من الأطول إلى الأقصر (Best-Fit Decreasing)
        validPieces.sort((a, b) => b.length - a.length);

        const bars = [];

        // خوارزمية Best-Fit Decreasing مع احتساب سمك سلاح المنشار
        validPieces.forEach(piece => {
            let bestBarIndex = -1;
            let minRemainingSpace = Infinity;

            for (let i = 0; i < bars.length; i++) {
                const bar = bars[i];
                // احتساب سمك سلاح المنشار إذا لم تكن القطعة الأولى في العود
                const neededKerf = bar.cuts.length > 0 ? bladeKerf : 0;
                const requiredLength = piece.length + neededKerf;

                if (bar.remainingSpace >= requiredLength) {
                    const spaceAfter = bar.remainingSpace - requiredLength;
                    if (spaceAfter < minRemainingSpace) {
                        minRemainingSpace = spaceAfter;
                        bestBarIndex = i;
                    }
                }
            }

            if (bestBarIndex !== -1) {
                // وضع القطعة في أفضل عود متاح
                const bar = bars[bestBarIndex];
                const neededKerf = bar.cuts.length > 0 ? bladeKerf : 0;
                bar.cuts.push({
                    ...piece,
                    kerfBefore: neededKerf
                });
                bar.usedLength += piece.length + neededKerf;
                bar.remainingSpace = stockLength - bar.usedLength;
            } else {
                // فتح عود جديد
                const newBar = {
                    barNumber: bars.length + 1,
                    stockLength: stockLength,
                    cuts: [{
                        ...piece,
                        kerfBefore: 0
                    }],
                    usedLength: piece.length,
                    remainingSpace: stockLength - piece.length
                };
                bars.push(newBar);
            }
        });

        // حساب الإحصائيات الإجمالية
        const totalBars = bars.length;
        const totalStockLength = totalBars * stockLength;
        const totalNetPiecesLength = validPieces.reduce((acc, p) => acc + p.length, 0);
        const totalWasteLength = Math.max(0, totalStockLength - totalNetPiecesLength);

        const totalStockMeters = (totalStockLength / 100);
        const totalUsedMeters = (totalNetPiecesLength / 100);
        const totalWasteMeters = (totalWasteLength / 100);
        const wastePercentage = totalStockLength > 0 ? ((totalWasteLength / totalStockLength) * 100) : 0;
        const efficiency = 100 - wastePercentage;

        // حساب نسبة الاستغلال لكل عود
        bars.forEach(bar => {
            const netUsedInBar = bar.cuts.reduce((acc, c) => acc + c.length, 0);
            bar.netUsedLength = netUsedInBar;
            bar.scrap = Math.max(0, stockLength - bar.usedLength);
            bar.efficiency = ((netUsedInBar / stockLength) * 100).toFixed(1);
        });

        return {
            bars,
            totalBars,
            totalStockMeters: totalStockMeters.toFixed(2),
            totalUsedMeters: totalUsedMeters.toFixed(2),
            totalWasteMeters: totalWasteMeters.toFixed(2),
            wastePercentage: wastePercentage.toFixed(1),
            efficiency: efficiency.toFixed(1),
            oversizedPieces
        };
    }
};

window.CuttingOptimizer = CuttingOptimizer;
