import type { Translations } from "../services/I18nService.ts";

/**
 * Russian translations
 */
export const ru: Translations = {
  // Widget header & general
  "widget.header.title": "ПОДДЕРЖАТЬ",
  "widget.loading": "Загрузка виджета...",
  "widget.footer.contact": "Связаться с разработчиками",

  // Donation type toggle
  "donation.type.oneTime": "Разовый",
  "donation.type.monthly": "Ежемесячный",

  // Amount section
  "amount.tooltip": "Любой токен, любая сеть — автоконвертация",
  "amount.helper": "Какую сумму вы хотите пожертвовать?",
  "amount.helper.subscription": "Сумма ежемесячной подписки",
  "amount.ariaLabel": "Сумма пожертвования",
  "amount.presetAriaLabel": "Установить сумму {currency}{amount}",

  // Wallet connection
  "wallet.connecting": "Подключение...",
  "wallet.connect": "Подключить кошелёк",
  "wallet.connectSubtext": "Для завершения пожертвования",
  "wallet.connectAriaLabel": "Подключить кошелёк",
  "wallet.disconnectAriaLabel": "Отключить кошелёк",
  "wallet.switchNetworkAriaLabel": "Сменить сеть",

  // Donate button
  "donate.processing": "Обработка...",
  "donate.calculating": "Расчёт...",
  "donate.pay": "Оплатить",
  "donate.payWithAmount": "Оплатить {amount} {token}",
  "donate.processingAriaLabel": "Обработка платежа, пожалуйста подождите",
  "donate.calculatingAriaLabel": "Расчёт суммы платежа, пожалуйста подождите",
  "donate.disabledAriaLabel": "кнопка неактивна",

  // Button states
  "button.processing": "Обработка...",
  "button.calculating": "Расчёт...",
  "button.donate": "Пожертвовать",
  "button.subscribe": "Подписаться",

  // Success state
  "success.defaultMessage": "Спасибо за ваше пожертвование!",
  "success.subscription.message": "Подписка активирована!",
  "success.donateAgain": "Пожертвовать снова",
  "success.youDonated": "Вы пожертвовали {amount}",
  "success.amount": "Сумма",
  "success.network": "Сеть",
  "success.recipient": "Получатель",
  "success.time": "Время",
  "success.transactionDetails": "Детали транзакции",

  // Token selection
  "token.choosePayment": "Выберите токен для оплаты",
  "token.insufficientBalance": "недостаточный баланс",
  "token.selectionAriaLabel": "Выбор токена",
  "token.noTokensWithBalance": "Нет токенов с балансом",
  "token.noTokensWithBalanceHint": "Пополните кошелёк для пожертвования",

  // Toast notifications
  "toast.successAriaLabel": "Уведомление об успехе",
  "toast.errorAriaLabel": "Уведомление об ошибке",
  "toast.warningAriaLabel": "Предупреждение",
  "toast.infoAriaLabel": "Информационное уведомление",
  "toast.closeAriaLabel": "Закрыть уведомление",

  // Messages
  "message.donationSuccess": "Пожертвование успешно! Спасибо за вашу поддержку.",
  "message.invalidRecipient": "Неверный формат адреса получателя",
  "message.initFailed": "Не удалось инициализировать виджет",
  "message.walletConnectionFailed": "Не удалось открыть подключение кошелька",

  // Error messages
  "error.networkConnection":
    "Не удалось связаться с сервером. Проверьте подключение к интернету.",
  "error.networkSwitchFailed": "Переключитесь на {network}",
  "error.invalidParams":
    "Неверные параметры запроса. Попробуйте другую сумму или токен.",
  "error.routeNotFound": "Маршрут не найден. Попробуйте другой токен.",
  "error.serverUnavailable":
    "Сервер временно недоступен. Попробуйте позже.",
  "error.unsupportedNetwork": "Сеть не поддерживается.",
  "error.unsupportedToken": "Токен не поддерживается.",
  "error.insufficientLiquidity":
    "Недостаточно ликвидности для этого обмена.",
  "error.insufficientFunds":
    "Недостаточно средств в вашем кошельке.",
  "error.slippageTooHigh": "Слишком высокое проскальзывание для этого обмена.",
  "error.transactionRejected": "Транзакция отклонена пользователем.",
  "error.signatureRejected": "Подпись отклонена пользователем.",
  "error.subscriptionFailed": "Не удалось создать подписку. Попробуйте снова.",
  "error.walletNotConnected": "Сначала подключите кошелёк.",
  "error.switchToPolygon": "Пожалуйста, переключитесь на сеть Polygon в кошельке для подписи подписки.",

  // Subscription overlay
  "subscription.overlay.title": "Настройка подписки",
  "subscription.overlay.description": "Пожалуйста, следуйте инструкциям в кошельке",
  "subscription.overlay.hint": "Нажмите, чтобы начать процесс подписки",

  // Subscription steps
  "subscription.step.switching": "Переключение на Polygon",
  "subscription.step.switching.desc": "Подтвердите смену сети",
  "subscription.step.signing": "Подписание подписки",
  "subscription.step.signing.desc": "Подпишите запрос на подписку",
  "subscription.step.building": "Подготовка транзакции",
  "subscription.step.building.desc": "Построение действий подписки...",
  "subscription.step.returning": "Переключение сети",
  "subscription.step.returning.desc": "Возврат к исходной сети",
  "subscription.step.quoting": "Расчёт котировки",
  "subscription.step.quoting.desc": "Получение лучшего курса",
  "subscription.step.approving": "Одобрение токена",
  "subscription.step.approving.desc": "Подтвердите перевод токенов",
  "subscription.step.subscribing": "Подтверждение подписки",
  "subscription.step.subscribing.desc": "Подтвердите транзакцию",
  "subscription.step.confirming": "Ожидание подтверждения",
  "subscription.step.confirming.desc": "Транзакция отправлена, ожидание подтверждения",
};

